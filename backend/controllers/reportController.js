const User = require('../models/User');
const Car = require('../models/Car');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const ScheduledReport = require('../models/ScheduledReport');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const PptxGenJS = require('pptxgenjs');

const COLORS_HEX = ['e63946', 'f4a261', '2a9d8f', '457b9d', 'e9c46a', '264653'];

// ─────────────────────────────────────────────
// Helper: parse date range from query
// ─────────────────────────────────────────────
const getDateRange = (req) => {
    const { startDate, endDate, preset } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let start;
    if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
    } else {
        start = new Date();
        const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
        start.setDate(start.getDate() - days);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end };
};

// ─────────────────────────────────────────────
// Helper: log audit
// ─────────────────────────────────────────────
const logExport = async (req, reportType, format) => {
    try {
        await AuditLog.create({
            adminId: req.user._id,
            action: 'EXPORT_REPORT',
            targetType: 'Report',
            targetId: req.user._id,
            details: `Exported ${reportType} report as ${format.toUpperCase()}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (e) { /* non-blocking */ }
};

// ─────────────────────────────────────────────
// Data fetchers per report type
// ─────────────────────────────────────────────
const fetchUsersData = async (start, end) => {
    const [total, buyers, sellers, banned, newInRange] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'dealer' }),
        User.countDocuments({ status: 'banned' }),
        User.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    // registrations grouped by day in range
    const registrations = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);

    const rows = await User.find({ createdAt: { $gte: start, $lte: end } })
        .select('name email role status createdAt')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    return { summary: { total, buyers, sellers, banned, newInRange }, registrations, rows };
};

const fetchListingsData = async (start, end) => {
    const [active, pending, sold, expired] = await Promise.all([
        Car.countDocuments({ status: 'active' }),
        Car.countDocuments({ status: 'pending' }),
        Car.countDocuments({ status: 'sold' }),
        Car.countDocuments({ status: 'expired' }),
    ]);

    const byBrand = await Car.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$make', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    const avgPriceByMake = await Car.aggregate([
        { $group: { _id: '$make', avgPrice: { $avg: '$price' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    const rows = await Car.find({ createdAt: { $gte: start, $lte: end } })
        .select('title make model year price status createdAt')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    return { summary: { active, pending, sold, expired }, byBrand, avgPriceByMake, rows };
};

const fetchTransactionsData = async (start, end) => {
    const [totalOrders, completedOrders] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Order.countDocuments({ status: 'completed', createdAt: { $gte: start, $lte: end } })
    ]);

    const revenue = await Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const byStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const rows = await Order.find({ createdAt: { $gte: start, $lte: end } })
        .populate('user', 'name email')
        .populate('car', 'title make model price')
        .select('user car basePrice taxAmount commissionAmount totalPrice status createdAt')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    return {
        summary: {
            totalOrders,
            completedOrders,
            revenue: revenue[0]?.total || 0,
            conversionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) + '%' : '0%'
        },
        byStatus,
        rows
    };
};

const fetchTestDrivesData = async (start, end) => {
    // Use Order model as proxy (type: test-drive) or the Car model test drive data
    // Provide mock-friendly structure
    const rows = await Order.find({
        orderType: 'test-drive',
        createdAt: { $gte: start, $lte: end }
    }).populate('user', 'name email').populate('car', 'title make model').limit(200).lean();

    const [pending, confirmed, completed] = await Promise.all([
        Order.countDocuments({ orderType: 'test-drive', status: 'pending', createdAt: { $gte: start, $lte: end } }),
        Order.countDocuments({ orderType: 'test-drive', status: 'confirmed', createdAt: { $gte: start, $lte: end } }),
        Order.countDocuments({ orderType: 'test-drive', status: 'completed', createdAt: { $gte: start, $lte: end } })
    ]);

    return { summary: { pending, confirmed, completed, total: pending + confirmed + completed }, rows };
};

const fetchFinancialData = async (start, end) => {
    const revenue = await Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                revenue: { $sum: '$totalPrice' },
                baseRevenue: { $sum: '$basePrice' },
                totalTax: { $sum: '$taxAmount' },
                totalCommission: { $sum: '$commissionAmount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const totalRevenue = revenue.reduce((acc, m) => acc + m.revenue, 0);
    const totalTax = revenue.reduce((acc, m) => acc + m.totalTax, 0);
    const totalCommission = revenue.reduce((acc, m) => acc + m.totalCommission, 0);

    return {
        summary: {
            totalGrossVolume: totalRevenue,
            totalTaxCollected: totalTax,
            netPlatformCommission: totalCommission,
            totalBaseSales: revenue.reduce((acc, m) => acc + m.baseRevenue, 0)
        },
        monthly: revenue,
        rows: revenue
    };
};

const getDataForType = async (reportType, start, end) => {
    switch (reportType) {
        case 'users': return fetchUsersData(start, end);
        case 'listings': return fetchListingsData(start, end);
        case 'transactions': return fetchTransactionsData(start, end);
        case 'test-drives': return fetchTestDrivesData(start, end);
        case 'financial': return fetchFinancialData(start, end);
        default: return {};
    }
};

// ─────────────────────────────────────────────
// GET /api/reports/:type  – return JSON data
// ─────────────────────────────────────────────
const getReportData = async (req, res) => {
    try {
        const { type } = req.params;
        const { start, end } = getDateRange(req);
        const data = await getDataForType(type, start, end);
        res.json({ type, dateRange: { start, end }, ...data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching report data' });
    }
};

// ─────────────────────────────────────────────
// POST /api/reports/export  – stream file
// ─────────────────────────────────────────────
const exportReport = async (req, res) => {
    try {
        const { reportType = 'users', format = 'xlsx', startDate, endDate, preset = '30d' } = req.body;

        const start = startDate ? new Date(startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - (preset === '7d' ? 7 : preset === '90d' ? 90 : 30)); return d; })();
        const end = endDate ? new Date(endDate) : new Date();

        const data = await getDataForType(reportType, start, end);
        await logExport(req, reportType, format);

        const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        const dateStr = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
        const filename = `${reportType}_report_${Date.now()}`;

        // ── EXCEL ──────────────────────────────────────────
        if (format === 'xlsx') {
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summaryTitle = [[`${reportType.toUpperCase()} REPORT SUMMARY`]];
            const summaryPeriod = [[`Period: ${dateStr}`]];
            const summaryEmpty = [[]];
            const summaryHeaders = [['Metric', 'Value']];
            const summaryRows = Object.entries(data.summary || {}).map(([k, v]) => [
                k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                typeof v === 'number' ? v : String(v)
            ]);

            const ws1 = XLSX.utils.aoa_to_sheet([
                ...summaryTitle,
                ...summaryPeriod,
                ...summaryEmpty,
                ...summaryHeaders,
                ...summaryRows
            ]);

            // Styling (though limited in base xlsx, we can set col widths)
            ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

            // Data rows sheet
            if (data.rows && data.rows.length > 0) {
                const flatRows = data.rows.map(r => {
                    const flat = {};
                    const flatten = (obj, prefix = '') => {
                        if (!obj || typeof obj !== 'object') return;
                        Object.keys(obj).forEach(k => {
                            if (k === '__v' || k === '_id' || k === 'password') return;
                            const val = obj[k];
                            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                                flatten(val, `${prefix}${k}_`);
                            } else {
                                flat[`${prefix}${k}`] = val instanceof Date ? val.toLocaleString() : val;
                            }
                        });
                    };
                    flatten(r);
                    return flat;
                });
                const ws2 = XLSX.utils.json_to_sheet(flatRows);

                // Auto-width columns
                const colWidths = Object.keys(flatRows[0] || {}).map(key => ({
                    wch: Math.max(key.length, ...flatRows.slice(0, 10).map(row => String(row[key] || '').length)) + 2
                }));
                ws2['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws2, 'Raw Data');
            }

            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buf);
        }

        // ── PDF ────────────────────────────────────────────
        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            doc.pipe(res);

            const pageW = doc.page.width;
            const marginL = 40;
            const usableW = pageW - marginL * 2;

            // ── Premium Header ──────────────────────────────────
            doc.rect(0, 0, pageW, 110).fill('#1a1a2e');

            // Accent line
            doc.rect(0, 107, pageW, 3).fill('#e63946');

            doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold')
                .text('CAR SHOPPING', marginL, 25, { characterSpacing: 2 });

            doc.fillColor('#aaaaaa').fontSize(10).font('Helvetica')
                .text('ADMINISTRATIVE INTELLIGENCE REPORT', marginL, 58, { characterSpacing: 1 });

            doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
                .text(title.toUpperCase(), marginL, 78, { width: usableW, align: 'right' });

            doc.fillColor('#e63946').fontSize(10).font('Helvetica-Bold')
                .text(dateStr, marginL, 95, { width: usableW, align: 'right' });

            // reset state
            doc.fillColor('#000000');
            doc.y = 135;

            // ── Summary Cards ─────────────────────────────────
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('EXECUTIVE SUMMARY', marginL);
            doc.moveDown(0.5);

            const summaryEntries = Object.entries(data.summary || {});
            const cardWidth = (usableW - 20) / 2;
            let currentX = marginL;
            let currentY = doc.y;

            summaryEntries.forEach(([k, v], idx) => {
                if (idx > 0 && idx % 2 === 0) {
                    currentX = marginL;
                    currentY += 50;
                } else if (idx > 0) {
                    currentX += cardWidth + 20;
                }

                // Card shadow/border
                doc.rect(currentX, currentY, cardWidth, 40).lineWidth(0.5).stroke('#eeeeee');

                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                doc.fontSize(9).font('Helvetica').fillColor('#888888')
                    .text(label, currentX + 10, currentY + 8);

                doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a2e')
                    .text(String(v), currentX + 10, currentY + 22);
            });

            doc.y = currentY + 60;
            doc.moveDown(1);

            // ── Data Table ────────────────────────────────────
            const tableRows = (data.rows || []).slice(0, 50); // Increased limit for detailed report
            if (tableRows.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('DETAILED DATA RECORDS', marginL);
                doc.moveDown(0.6);

                const rawKeys = Object.keys(tableRows[0]).filter(k => !['__v', '_id', 'password', 'tokenVersion', 'twoFactorSecret'].includes(k));
                const keys = rawKeys.slice(0, 6);
                const colW = usableW / keys.length;
                const rowH = 24;
                const headerH = 26;

                // Draw table header
                let tableY = doc.y;
                doc.rect(marginL, tableY, usableW, headerH).fill('#1a1a2e');
                keys.forEach((k, i) => {
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
                        .text(k.replace(/([A-Z])/g, ' $1').toUpperCase(),
                            marginL + i * colW + 6, tableY + 9,
                            { width: colW - 12, lineBreak: false, ellipsis: true });
                });
                doc.y = tableY + headerH;

                // Draw data rows
                tableRows.forEach((row, ri) => {
                    if (doc.y + rowH > doc.page.height - 60) {
                        doc.addPage();
                        doc.y = 50;
                        // Redraw header on new page
                        tableY = doc.y;
                        doc.rect(marginL, tableY, usableW, headerH).fill('#1a1a2e');
                        keys.forEach((k, i) => {
                            doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
                                .text(k.replace(/([A-Z])/g, ' $1').toUpperCase(),
                                    marginL + i * colW + 6, tableY + 9,
                                    { width: colW - 12, lineBreak: false, ellipsis: true });
                        });
                        doc.y = tableY + headerH;
                    }
                    const rowY = doc.y;
                    const bgColor = ri % 2 === 0 ? '#fcfcfc' : '#ffffff';
                    doc.rect(marginL, rowY, usableW, rowH).fill(bgColor);
                    doc.rect(marginL, rowY, usableW, rowH).lineWidth(0.1).stroke('#dddddd');

                    keys.forEach((k, i) => {
                        const val = row[k];
                        let text = val == null ? '—' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                        doc.fontSize(8).font('Helvetica').fillColor('#333333')
                            .text(text, marginL + i * colW + 6, rowY + 8,
                                { width: colW - 12, lineBreak: false, ellipsis: true });
                    });
                    doc.y = rowY + rowH;
                });
            } else {
                doc.fontSize(11).font('Helvetica').fillColor('#888888')
                    .text('No data records for the selected period.', marginL);
            }

            // ── Footer ────────────────────────────────────────
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).font('Helvetica').fillColor('#bbbbbb')
                    .text(`Page ${i + 1} of ${range.count}  |  Generated on ${new Date().toLocaleString()}  |  Car Shopping Intelligence`,
                        marginL, doc.page.height - 30, { align: 'center', width: usableW });
            }

            doc.end();
            return;
        }

        // ── POWERPOINT ─────────────────────────────────────
        if (format === 'pptx') {
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_WIDE';

            const BG = '1a1a2e';
            const ACCENT = 'e63946';
            const WHITE = 'FFFFFF';
            const GREY = '888888';

            // ── Slide 1: Title ──────────────────────────────
            const slide1 = pptx.addSlide();
            slide1.background = { color: BG };
            slide1.addText(title, { x: 0.5, y: 1.2, w: '90%', fontSize: 40, bold: true, color: WHITE });
            slide1.addText(`Period: ${dateStr}`, { x: 0.5, y: 3.2, w: '90%', fontSize: 16, color: GREY });
            slide1.addText(`Generated: ${new Date().toLocaleString()}`, { x: 0.5, y: 3.8, w: '90%', fontSize: 13, color: GREY });

            // ── Slide 2: KPI Summary ────────────────────────
            const slide2 = pptx.addSlide();
            slide2.background = { color: BG };
            slide2.addText('Key Metrics', { x: 0.5, y: 0.3, w: '90%', fontSize: 26, bold: true, color: WHITE });

            const summaryItems = Object.entries(data.summary || {});
            const cols = Math.min(summaryItems.length, 3) || 1;
            const cardW = 9 / cols;

            summaryItems.slice(0, 6).forEach(([k, v], idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const x = 0.5 + col * cardW;
                const y = 1.3 + row * 1.8;
                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

                slide2.addShape(pptx.ShapeType.rect, { x, y, w: cardW - 0.2, h: 1.5, fill: { color: '16213e' } });
                slide2.addText(String(v), { x, y: y + 0.2, w: cardW - 0.2, h: 0.8, fontSize: 28, bold: true, color: ACCENT, align: 'center' });
                slide2.addText(label, { x, y: y + 1.0, w: cardW - 0.2, h: 0.4, fontSize: 11, color: GREY, align: 'center' });
            });

            // ── Slide 3: Data Table ─────────────────────────
            if (data.rows && data.rows.length > 0) {
                const slide4 = pptx.addSlide();
                slide4.background = { color: 'FFFFFF' };
                slide4.addText('Data Records (Top 20)', { x: 0.5, y: 0.3, w: '90%', fontSize: 22, bold: true, color: '1a1a2e' });

                const tableRows = data.rows.slice(0, 20);
                const keys = Object.keys(tableRows[0]).filter(k => !['__v', '_id', 'password'].includes(k)).slice(0, 5);

                const tableData = [
                    keys.map(k => ({ text: k.toUpperCase(), options: { bold: true, color: WHITE, fill: '1a1a2e', fontSize: 10 } })),
                    ...tableRows.map((row, ri) =>
                        keys.map(k => {
                            const val = row[k];
                            const text = val == null ? '—' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                            return { text: text.slice(0, 30), options: { color: '333333', fill: ri % 2 === 0 ? 'f5f5f5' : 'ffffff', fontSize: 9 } };
                        })
                    )
                ];

                slide4.addTable(tableData, { x: 0.5, y: 1.0, w: 12, colW: Array(keys.length).fill(12 / keys.length) });
            }

            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pptx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            const buf = await pptx.write({ outputType: 'nodebuffer' });
            return res.send(buf);
        }

        res.status(400).json({ message: 'Unsupported export format' });
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

// ─────────────────────────────────────────────
// Scheduled Report CRUD
// ─────────────────────────────────────────────
const getScheduledReports = async (req, res) => {
    try {
        const reports = await ScheduledReport.find({ adminId: req.user._id }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) { res.status(500).json({ message: 'Error fetching schedules' }); }
};

const createScheduledReport = async (req, res) => {
    try {
        const { name, reportType, format, frequency, recipients, filters } = req.body;
        if (!name || !reportType || !format || !frequency) {
            return res.status(400).json({ message: 'name, reportType, format, and frequency are required' });
        }
        const report = await ScheduledReport.create({ adminId: req.user._id, name, reportType, format, frequency, recipients, filters });
        res.status(201).json({ message: 'Scheduled report created', report });
    } catch (err) { res.status(500).json({ message: 'Error creating schedule' }); }
};

const deleteScheduledReport = async (req, res) => {
    try {
        const report = await ScheduledReport.findOneAndDelete({ _id: req.params.id, adminId: req.user._id });
        if (!report) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Scheduled report deleted' });
    } catch (err) { res.status(500).json({ message: 'Error deleting schedule' }); }
};

module.exports = {
    getReportData,
    exportReport,
    getScheduledReports,
    createScheduledReport,
    deleteScheduledReport
};
