import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    FiDownload, FiUsers, FiBox, FiShoppingBag, FiTruck, FiDollarSign,
    FiCalendar, FiFilter, FiPlus, FiTrash2, FiClock, FiBarChart2, FiPrinter
} from 'react-icons/fi';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#264653'];

const REPORT_TYPES = [
    { key: 'users', label: 'Users', icon: <FiUsers /> },
    { key: 'listings', label: 'Listings', icon: <FiBox /> },
    { key: 'transactions', label: 'Transactions', icon: <FiShoppingBag /> },
    { key: 'test-drives', label: 'Test Drives', icon: <FiTruck /> },
    { key: 'financial', label: 'Financial', icon: <FiDollarSign /> },
];

const PRESETS = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
];

export default function AdminAnalytics() {
    const [reportType, setReportType] = useState('users');
    const [preset, setPreset] = useState('30d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Scheduled Reports state
    const [schedules, setSchedules] = useState([]);
    const [schedLoading, setSchedLoading] = useState(false);
    const [showSchedForm, setShowSchedForm] = useState(false);
    const [schedForm, setSchedForm] = useState({ name: '', reportType: 'users', format: 'xlsx', frequency: 'weekly', recipients: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = customStart && customEnd
                ? { startDate: customStart, endDate: customEnd }
                : { preset };
            const res = await api.get(`/reports/data/${reportType}`, { params });
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    }, [reportType, preset, customStart, customEnd]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchSchedules = async () => {
        setSchedLoading(true);
        try {
            const res = await api.get('/reports/scheduled');
            setSchedules(res.data);
        } catch { toast.error('Failed to load scheduled reports'); }
        finally { setSchedLoading(false); }
    };

    useEffect(() => { if (activeTab === 'scheduled') fetchSchedules(); }, [activeTab]);

    const handleExport = async (format) => {
        setExporting(true);
        const mimeTypes = {
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pdf: 'application/pdf',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };
        try {
            const payload = {
                reportType,
                format,
                ...(customStart && customEnd ? { startDate: customStart, endDate: customEnd } : { preset })
            };
            const res = await api.post('/reports/export', payload, { responseType: 'blob' });

            // Guard: check if response is actually an error JSON blob
            if (res.data.type === 'application/json') {
                const text = await res.data.text();
                const err = JSON.parse(text);
                toast.error(err.message || 'Export failed');
                return;
            }

            const blob = new Blob([res.data], { type: mimeTypes[format] });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`${format.toUpperCase()} downloaded successfully!`);
        } catch (err) {
            // Try to read error message from blob response
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const parsed = JSON.parse(text);
                    toast.error(parsed.message || 'Export failed');
                } catch {
                    toast.error('Export failed — server error');
                }
            } else {
                toast.error(err.response?.data?.message || 'Export failed');
            }
        } finally {
            setExporting(false);
        }
    };

    const handlePrintDashboard = async () => {
        setExporting(true);
        try {
            const el = document.getElementById('analytics-dashboard');
            if (!el) return;
            // Temporarily hide UI elements we don't want printed (optional)
            const captureCanvas = await html2canvas(el, { scale: 1.5, useCORS: true, logging: false });
            const imgData = captureCanvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (captureCanvas.height * pdfWidth) / captureCanvas.width;

            // Check if height exceeds A4 (297mm)
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= 297;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= 297;
            }

            pdf.save(`${reportType}_dashboard_snapshot_${Date.now()}.pdf`);
            toast.success('Dashboard PDF captured successfully!');
        } catch (err) {
            toast.error('Failed to capture dashboard');
        } finally {
            setExporting(false);
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            const recipientsArr = schedForm.recipients.split(',').map(r => r.trim()).filter(Boolean);
            const res = await api.post('/reports/scheduled', { ...schedForm, recipients: recipientsArr });
            toast.success(res.data.message);
            setSchedules(prev => [res.data.report, ...prev]);
            setShowSchedForm(false);
            setSchedForm({ name: '', reportType: 'users', format: 'xlsx', frequency: 'weekly', recipients: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create schedule'); }
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('Delete this scheduled report?')) return;
        try {
            await api.delete(`/reports/scheduled/${id}`);
            toast.success('Scheduled report deleted');
            setSchedules(prev => prev.filter(s => s._id !== id));
        } catch { toast.error('Delete failed'); }
    };

    const SummaryCard = ({ label, value, color = '#e63946' }) => (
        <div className="metric-card" style={{ cursor: 'default' }}>
            <div className="metric-icon" style={{ background: `${color}22`, color }}>
                <FiBarChart2 />
            </div>
            <div className="metric-info">
                <h4>{label}</h4>
                <h2 style={{ fontSize: '1.5rem' }}>{value}</h2>
            </div>
        </div>
    );

    const summary = data?.summary || {};

    // ── Chart Data Helpers ──────────────────────────────────────────
    const getChartData = () => {
        if (reportType === 'users') return (data?.registrations || []).map(r => ({ name: r._id, Users: r.count }));
        if (reportType === 'listings') return (data?.byBrand || []).map(b => ({ name: b._id, Listings: b.count }));
        if (reportType === 'transactions') return (data?.byStatus || []).map(s => ({ name: s._id, Orders: s.count }));
        if (reportType === 'financial') return (data?.monthly || []).map(m => ({ name: m._id, Revenue: m.revenue }));
        return [];
    };

    const getChartKey = () => {
        if (reportType === 'users') return 'Users';
        if (reportType === 'listings') return 'Listings';
        if (reportType === 'transactions') return 'Orders';
        if (reportType === 'financial') return 'Revenue';
        return 'count';
    };

    const chartData = getChartData();
    const chartKey = getChartKey();

    const pieData = reportType === 'listings'
        ? (data?.avgPriceByMake || []).map(b => ({ name: b._id, value: Math.round(b.avgPrice) }))
        : null;

    const tableRows = data?.rows || [];
    const tableKeys = tableRows.length > 0 && tableRows[0] && typeof tableRows[0] === 'object'
        ? Object.keys(tableRows[0]).filter(k => !['__v', 'password', 'twoFactorSecret'].includes(k)).slice(0, 6)
        : [];

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>Analytics & Reports</h1>
                    <p className="page-subtitle" style={{ margin: 0 }}>Generate, filter, and export rich reports in multiple formats.</p>
                </div>

                {/* Export Actions */}
                <div className="glass-panel" style={{ display: 'flex', gap: 10, padding: '8px 16px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ paddingRight: 10, borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Export</span>
                    </div>
                    <button className="icon-btn-text" disabled={exporting} onClick={handlePrintDashboard} title="Snapshot of current dashboard">
                        <FiPrinter /> <span>Visual PDF</span>
                    </button>
                    <button className="icon-btn-text" disabled={exporting} onClick={() => handleExport('xlsx')} title="Download as Excel spreadsheet">
                        <FiDownload /> <span>Excel</span>
                    </button>
                    <button className="icon-btn-text" disabled={exporting} onClick={() => handleExport('pdf')} title="Detailed data report in PDF">
                        <FiDownload /> <span>Data PDF</span>
                    </button>
                    <button className="btn btn-primary btn-sm" disabled={exporting} onClick={() => handleExport('pptx')} style={{ borderRadius: 8, padding: '6px 14px' }}>
                        {exporting ? 'Processing...' : 'PowerPoint'}
                    </button>
                </div>
            </div>

            {/* ── Report Type Tabs ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {REPORT_TYPES.map(rt => (
                    <button key={rt.key} onClick={() => setReportType(rt.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 8, border: '1px solid',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                            background: reportType === rt.key ? 'var(--primary)' : 'var(--bg-card)',
                            borderColor: reportType === rt.key ? 'var(--primary)' : 'var(--border)',
                            color: reportType === rt.key ? '#fff' : 'var(--text-muted)'
                        }}>
                        {rt.icon} {rt.label}
                    </button>
                ))}
            </div>

            {/* ── Date & Filter Controls ── */}
            <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <FiCalendar style={{ color: 'var(--text-muted)' }} />
                {PRESETS.map(p => (
                    <button key={p.value} onClick={() => { setPreset(p.value); setCustomStart(''); setCustomEnd(''); }}
                        style={{
                            padding: '6px 14px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                            background: preset === p.value && !customStart ? 'var(--primary)' : 'var(--bg-card)',
                            borderColor: preset === p.value && !customStart ? 'var(--primary)' : 'var(--border)',
                            color: preset === p.value && !customStart ? '#fff' : 'var(--text-muted)'
                        }}>
                        {p.label}
                    </button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Custom:</span>
                    <input type="date" className="form-control" style={{ padding: '5px 10px', fontSize: '0.82rem', width: 140 }}
                        value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    <span style={{ color: 'var(--text-muted)' }}>–</span>
                    <input type="date" className="form-control" style={{ padding: '5px 10px', fontSize: '0.82rem', width: 140 }}
                        value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
            </div>

            {/* ── Section Tabs ── */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                {['overview', 'data table', 'scheduled'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '9px 20px', border: 'none', background: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Dashboard Content to Print ── */}
            <div id="analytics-dashboard" style={{ background: 'var(--bg-body)', padding: '10px' }}>
                {/* ── Overview Tab ── */}
                {activeTab === 'overview' && (
                    loading ? <div className="spinner" style={{ marginTop: '10vh' }} /> : (
                        <>
                            {/* KPI Cards */}
                            <div className="metric-grid" style={{ marginBottom: 28 }}>
                                {Object.entries(summary || {}).map(([k, v], i) => (
                                    <SummaryCard key={k}
                                        label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                        value={typeof v === 'number' ? v.toLocaleString() : v}
                                        color={COLORS[i % COLORS.length]}
                                    />
                                ))}
                            </div>

                            {/* Charts */}
                            <div style={{ display: 'grid', gridTemplateColumns: pieData ? '2fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
                                {chartData.length > 0 && (
                                    <div className="chart-card">
                                        <h3>{REPORT_TYPES.find(r => r.key === reportType)?.label} Trend</h3>
                                        <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                            {reportType === 'financial' ? (
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                                    <XAxis dataKey="name" stroke="#888" fontSize={11} />
                                                    <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                                    <Tooltip formatter={v => [`$${v.toLocaleString()}`, chartKey]} contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }} />
                                                    <Area type="monotone" dataKey={chartKey} stroke="#2a9d8f" fill="url(#finGrad)" strokeWidth={3} dot={{ r: 4, fill: '#2a9d8f' }} />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                                    <XAxis dataKey="name" stroke="#888" fontSize={11} />
                                                    <YAxis stroke="#888" fontSize={11} />
                                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }} />
                                                    <Bar dataKey={chartKey} radius={[6, 6, 0, 0]}>
                                                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                {pieData && pieData.length > 0 && (
                                    <div className="chart-card">
                                        <h3>Avg Price by Make</h3>
                                        <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                            <PieChart>
                                                <Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Avg Price']} contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }} />
                                                <Legend iconSize={10} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                )}
            </div>
            {/* End of Print Wrapper */}

            {/* ── Data Table Tab ── */}
            {activeTab === 'data table' && (
                loading ? <div className="spinner" style={{ marginTop: '10vh' }} /> : (
                    <div className="card admin-panel">
                        <div className="panel-header">
                            <h3>Raw Data – {REPORT_TYPES.find(r => r.key === reportType)?.label}</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Showing up to 200 records. Use Export for the full dataset.</p>
                        </div>
                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>{tableKeys.map(k => <th key={k}>{k.replace(/([A-Z])/g, ' $1')}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {tableRows.length === 0
                                        ? <tr><td colSpan={tableKeys.length} style={{ textAlign: 'center', padding: 40 }}>No data for the selected period.</td></tr>
                                        : tableRows.slice(0, 100).map((row, i) => (
                                            <tr key={i}>
                                                {tableKeys.map(k => (
                                                    <td key={k} style={{ fontSize: '0.82rem' }}>
                                                        {row[k] == null ? '—'
                                                            : typeof row[k] === 'object' ? JSON.stringify(row[k]).slice(0, 40)
                                                                : String(row[k]).slice(0, 50)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* ── Scheduled Reports Tab ── */}
            {activeTab === 'scheduled' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Scheduled Reports</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowSchedForm(s => !s)}>
                            <FiPlus /> {showSchedForm ? 'Cancel' : 'New Schedule'}
                        </button>
                    </div>

                    {showSchedForm && (
                        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                            <h4 style={{ marginBottom: 16 }}>Configure Scheduled Report</h4>
                            <form onSubmit={handleCreateSchedule} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Report Name *</label>
                                    <input className="form-control" placeholder="e.g. Weekly User Summary" value={schedForm.name} onChange={e => setSchedForm({ ...schedForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Report Type *</label>
                                    <select className="form-control" value={schedForm.reportType} onChange={e => setSchedForm({ ...schedForm, reportType: e.target.value })}>
                                        {REPORT_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Format *</label>
                                    <select className="form-control" value={schedForm.format} onChange={e => setSchedForm({ ...schedForm, format: e.target.value })}>
                                        <option value="xlsx">Excel (XLSX)</option>
                                        <option value="pdf">PDF</option>
                                        <option value="pptx">PowerPoint (PPTX)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Frequency *</label>
                                    <select className="form-control" value={schedForm.frequency} onChange={e => setSchedForm({ ...schedForm, frequency: e.target.value })}>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                    <label>Recipient Emails (comma-separated)</label>
                                    <input className="form-control" placeholder="finance@co.com, ceo@co.com" value={schedForm.recipients} onChange={e => setSchedForm({ ...schedForm, recipients: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowSchedForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Schedule</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {schedLoading ? <div className="spinner" /> : (
                        <div className="card admin-panel">
                            <div className="admin-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Report Name</th>
                                            <th>Type</th>
                                            <th>Format</th>
                                            <th>Frequency</th>
                                            <th>Recipients</th>
                                            <th>Last Run</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.length === 0
                                            ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>No scheduled reports yet. Click "New Schedule" to create one.</td></tr>
                                            : schedules.map(s => (
                                                <tr key={s._id}>
                                                    <td><strong>{s.name}</strong></td>
                                                    <td><span className="badge">{s.reportType}</span></td>
                                                    <td><span className="badge badge-green">{s.format.toUpperCase()}</span></td>
                                                    <td style={{ textTransform: 'capitalize' }}>{s.frequency}</td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {s.recipients?.join(', ') || '—'}
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <FiClock />
                                                            {s.lastRunAt ? new Date(s.lastRunAt).toLocaleDateString() : 'Never'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button className="icon-btn delete" title="Delete Schedule" onClick={() => handleDeleteSchedule(s._id)}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
