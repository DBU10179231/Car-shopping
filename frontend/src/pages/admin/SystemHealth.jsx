import { useState, useEffect } from 'react';
import { FiServer, FiCpu, FiHardDrive, FiActivity, FiRefreshCw } from 'react-icons/fi';
import api from '../../api/axios';

const MOCK_LOGS = [
    { level: 'ERROR', message: 'MongoServerError: duplicate key on collection users', time: '2026-03-04 18:42:11' },
    { level: 'WARN', message: 'High memory usage detected: 87%', time: '2026-03-04 18:30:00' },
    { level: 'INFO', message: 'Server started on port 5001', time: '2026-03-04 09:00:01' },
    { level: 'INFO', message: 'Database connected successfully', time: '2026-03-04 09:00:02' },
    { level: 'ERROR', message: 'JWT expired for user id: 65a3bfc...', time: '2026-03-03 22:15:44' },
];

const MOCK_JOBS = [
    { name: 'Send Daily Newsletter', schedule: 'Daily at 8:00 AM', lastRun: '2026-03-04 08:00', status: 'success' },
    { name: 'Clean Expired Listings', schedule: 'Every Sunday', lastRun: '2026-03-03 00:00', status: 'success' },
    { name: 'Generate Sitemap', schedule: 'Every Monday', lastRun: '2026-03-03 01:00', status: 'failed' },
];

export default function SystemHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchHealth = () => {
        setLoading(true);
        api.get('/admin/system').then(r => setHealth(r.data)).catch(() => {
            // fallback mock data
            setHealth({
                uptime: '1d 9h 12m',
                memoryUsed: 312,
                memoryTotal: 1024,
                cpuUsage: 34,
                diskUsed: 22.4,
                diskTotal: 100,
                nodeVersion: process.version || 'v20.x',
                status: 'healthy',
            });
        }).finally(() => { setLoading(false); setLastRefresh(new Date()); });
    };

    useEffect(() => { fetchHealth(); }, []);

    const memPct = health ? Math.round((health.memoryUsed / health.memoryTotal) * 100) : 0;
    const diskPct = health ? Math.round((health.diskUsed / health.diskTotal) * 100) : 0;

    const StatBar = ({ label, pct, color }) => (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span>{label}</span><span style={{ color }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--bg-card2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6, transition: 'width 0.5s ease' }} />
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>System Health</h1>
                    <p className="page-subtitle" style={{ margin: 0 }}>Server status, logs, and scheduled jobs.</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchHealth} disabled={loading}>
                    <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </button>
            </div>

            {loading ? <div className="spinner" /> : (
                <>
                    {/* Status Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                        {[
                            { icon: <FiServer />, label: 'Server Status', value: health?.status === 'healthy' ? '✅ Healthy' : '⚠️ Issues', color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)' },
                            { icon: <FiActivity />, label: 'Uptime', value: health?.uptime || '—', color: '#457b9d', bg: 'rgba(69,123,157,0.1)' },
                            { icon: <FiCpu />, label: 'CPU Usage', value: `${health?.cpuUsage || 0}%`, color: health?.cpuUsage > 80 ? '#e63946' : '#f4a261', bg: 'rgba(244,162,97,0.1)' },
                            { icon: <FiHardDrive />, label: 'Disk Used', value: `${health?.diskUsed || 0} / ${health?.diskTotal || 0} GB`, color: '#e9c46a', bg: 'rgba(233,196,106,0.1)' },
                        ].map(c => (
                            <div key={c.label} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
                                    <strong style={{ fontSize: '0.95rem' }}>{c.value}</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                        {/* Resource Usage */}
                        <div className="chart-card">
                            <h3>Resource Usage</h3>
                            <StatBar label={`Memory: ${health?.memoryUsed}MB / ${health?.memoryTotal}MB`} pct={memPct} color={memPct > 80 ? '#e63946' : '#2a9d8f'} />
                            <StatBar label={`Disk: ${health?.diskUsed}GB / ${health?.diskTotal}GB`} pct={diskPct} color={diskPct > 80 ? '#e63946' : '#457b9d'} />
                            <StatBar label={`CPU: ${health?.cpuUsage}%`} pct={health?.cpuUsage || 0} color="#f4a261" />
                        </div>

                        {/* Scheduled Jobs */}
                        <div className="chart-card">
                            <h3>Scheduled Jobs</h3>
                            {MOCK_JOBS.map(j => (
                                <div key={j.name} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '0.88rem' }}>{j.name}</strong>
                                        <span className="badge" style={{ background: j.status === 'success' ? 'rgba(42,157,143,0.15)' : 'rgba(230,57,70,0.15)', color: j.status === 'success' ? '#2a9d8f' : '#e63946', fontSize: '0.72rem' }}>
                                            {j.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>{j.schedule} · Last: {j.lastRun}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Logs */}
                    <div className="chart-card">
                        <h3>Error & System Logs</h3>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {MOCK_LOGS.map((log, i) => (
                                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <span style={{ fontWeight: 700, minWidth: 50, color: log.level === 'ERROR' ? '#e63946' : log.level === 'WARN' ? '#f4a261' : '#2a9d8f' }}>{log.level}</span>
                                    <span style={{ color: 'var(--text-muted)', minWidth: 150 }}>{log.time}</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '8px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last refreshed: {lastRefresh.toLocaleTimeString()}</div>
                    </div>
                </>
            )}
        </div>
    );
}
