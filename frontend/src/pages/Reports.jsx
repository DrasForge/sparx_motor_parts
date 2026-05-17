import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Package, Printer, RefreshCw, Users, Clock, ReceiptText } from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [topProducts, setTopProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [closedShifts, setClosedShifts] = useState([]);
    const [activeShifts, setActiveShifts] = useState([]);
    const [shiftReport, setShiftReport] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Date Filters
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);


    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') fetchTopProducts();
        if (activeTab === 'transactions') fetchTransactions();
        if (activeTab === 'shifts') fetchClosedShifts();
        if (activeTab === 'activeShifts') fetchActiveShifts();
        if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab, selectedBranch, startDate, endDate]);

    useEffect(() => {
        if (activeTab !== 'activeShifts') return;

        const interval = setInterval(() => fetchActiveShifts(false), 15000);
        return () => clearInterval(interval);
    }, [activeTab, selectedBranch]);

    const money = (value) => {
        const amount = parseFloat(value || 0);
        const sign = amount < 0 ? '-' : '';
        return `${sign}₱${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const formatDateTime = (value) => value ? new Date(value).toLocaleString() : '-';
    const formatDuration = (minutes) => {
        const totalMinutes = parseInt(minutes || 0, 10);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/api/settings/update_branch.php');
            setBranches(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTopProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/analytics/top_products.php?branch_id=${selectedBranch}`);
            setTopProducts(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/reports/transactions.php?branch_id=${selectedBranch}&start_date=${startDate}&end_date=${endDate}`);
            setTransactions(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/reports/audit_logs.php');
            setAuditLogs(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchClosedShifts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/shifts/list_shifts.php?status=closed&branch_id=${selectedBranch}&start_date=${startDate}&end_date=${endDate}`);
            setClosedShifts(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchActiveShifts = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await axios.get(`/api/shifts/list_shifts.php?status=open&branch_id=${selectedBranch}`);
            setActiveShifts(res.data);
        } catch (err) { console.error(err); }
        finally { if (showLoading) setLoading(false); }
    };

    const openShiftReport = async (shiftId) => {
        try {
            const res = await axios.get(`/api/shifts/get_shift_report.php?shift_id=${shiftId}`);
            setShiftReport(res.data);
        } catch (err) {
            alert("Failed to load shift report: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                    <p className="text-gray-400">Detailed insights into your sales performance.</p>
                </div>

                { }
                {user.role === 'admin' && (
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
                        <span className="text-sm text-gray-400 px-2">Filter Branch:</span>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-gray-900 border border-gray-600 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            { }
            <div className="flex flex-wrap border-b border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'transactions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Transaction History
                </button>
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'shifts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Shift Reports
                </button>
                <button
                    onClick={() => setActiveTab('activeShifts')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'activeShifts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Active Cashiers
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'audit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Audit Logs
                </button>
            </div>

            {loading && <div className="text-center py-10 text-gray-500 animate-pulse">Loading data...</div>}

            {!loading && activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    { }
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Award className="text-yellow-500" />
                            Top Performing Products (Revenue)
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#9CA3AF" hide />
                                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#374151', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                        formatter={(value) => [`₱ ${parseFloat(value).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    { }
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Package className="text-blue-500" />
                            Detailed Product Performance
                        </h3>
                        <div className="overflow-auto max-h-80">
                            <table className="w-full text-left">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="p-3">Product</th>
                                        <th className="p-3 text-right">Sold Qty</th>
                                        <th className="p-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 text-sm">
                                    {topProducts.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-700/30">
                                            <td className="p-3">
                                                <div className="text-white font-medium">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.sku}</div>
                                            </td>
                                            <td className="p-3 text-right text-gray-300">{p.sold_qty}</td>
                                            <td className="p-3 text-right text-emerald-400 font-bold">₱{parseFloat(p.revenue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'transactions' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-end bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 block w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 block w-full"
                            />
                        </div>
                        <button 
                            onClick={fetchTransactions}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all"
                        >
                            Apply Range
                        </button>
                    </div>

                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4">Cashier</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Method</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-sm">
                                {transactions.map((txn, i) => (
                                    <tr key={i} className="hover:bg-gray-700/30">
                                        <td className="p-4 font-mono text-blue-400">{txn.transaction_id || `TXN-${txn.id}`}</td>
                                        <td className="p-4 text-gray-300">{new Date(txn.created_at).toLocaleString()}</td>
                                        <td className="p-4 text-gray-300">{txn.branch_name}</td>
                                        <td className="p-4 text-gray-300">{txn.cashier_name}</td>
                                        <td className="p-4 text-gray-300">{txn.customer_name}</td>
                                        <td className="p-4 text-gray-300 capitalize">{txn.payment_method}</td>
                                        <td className="p-4 text-right font-bold text-white">₱{parseFloat(txn.total).toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold
                                                ${txn.status === 'voided' ? 'bg-red-500/10 text-red-500' :
                                                    txn.status === 'refunded' ? 'bg-blue-500/10 text-blue-400' :
                                                        txn.status === 'partial_refund' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/10 text-green-400'}`}>
                                                {txn.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}

            {!loading && activeTab === 'shifts' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-end bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 block w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 block w-full"
                            />
                        </div>
                        <button
                            onClick={fetchClosedShifts}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all"
                        >
                            Apply Range
                        </button>
                    </div>

                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Shift</th>
                                        <th className="p-4">Cashier</th>
                                        <th className="p-4">Branch</th>
                                        <th className="p-4">Started</th>
                                        <th className="p-4">Ended</th>
                                        <th className="p-4 text-right">Expected</th>
                                        <th className="p-4 text-right">Ending Cash</th>
                                        <th className="p-4 text-right">Difference</th>
                                        <th className="p-4 text-center">Report</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 text-sm">
                                    {closedShifts.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-gray-700/30">
                                            <td className="p-4 font-mono text-blue-400">#{shift.id}</td>
                                            <td className="p-4 text-white font-medium">{shift.cashier_name}</td>
                                            <td className="p-4 text-gray-300">{shift.branch_name}</td>
                                            <td className="p-4 text-gray-300">{formatDateTime(shift.start_time)}</td>
                                            <td className="p-4 text-gray-300">{formatDateTime(shift.end_time)}</td>
                                            <td className="p-4 text-right text-gray-300">{money(shift.expected_cash)}</td>
                                            <td className="p-4 text-right text-gray-300">{money(shift.ending_cash)}</td>
                                            <td className={`p-4 text-right font-bold ${parseFloat(shift.difference || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                {money(shift.difference)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => openShiftReport(shift.id)}
                                                    className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    <Printer size={14} />
                                                    Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {closedShifts.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="p-8 text-center text-gray-500">No ended shifts found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'activeShifts' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="text-green-400" size={20} />
                                Active Cashier Shifts
                            </h3>
                            <p className="text-sm text-gray-400">Auto-refreshes every 15 seconds while this tab is open.</p>
                        </div>
                        <button
                            onClick={fetchActiveShifts}
                            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {activeShifts.map((shift) => (
                            <div key={shift.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                                            <h4 className="text-xl font-bold text-white">{shift.cashier_name}</h4>
                                        </div>
                                        <p className="text-sm text-gray-400">{shift.branch_name} • Shift #{shift.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs uppercase font-bold text-gray-500">Elapsed</div>
                                        <div className="text-lg font-mono text-yellow-400 flex items-center gap-1">
                                            <Clock size={16} />
                                            {formatDuration(shift.duration_minutes)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Started</div>
                                        <div className="text-sm text-white">{formatDateTime(shift.start_time)}</div>
                                    </div>
                                    <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Starting Cash</div>
                                        <div className="text-sm text-white font-mono">{money(shift.starting_cash)}</div>
                                    </div>
                                    <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Transactions</div>
                                        <div className="text-sm text-white font-mono">{shift.txn_count}</div>
                                    </div>
                                    <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 uppercase font-bold">Items Sold</div>
                                        <div className="text-sm text-white font-mono">{shift.items_sold}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                        <div className="text-xs text-green-300 uppercase font-bold">Cash Sales</div>
                                        <div className="text-lg text-green-300 font-mono">{money(shift.cash_sales)}</div>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                        <div className="text-xs text-blue-300 uppercase font-bold">GCash Sales</div>
                                        <div className="text-lg text-blue-300 font-mono">{money(shift.gcash_sales)}</div>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                        <div className="text-xs text-yellow-300 uppercase font-bold">Expected Drawer</div>
                                        <div className="text-lg text-yellow-300 font-mono">{money(shift.expected_cash)}</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-between text-sm border-t border-gray-700 pt-4">
                                    <span className="text-gray-400">Total Sales: <span className="text-white font-mono">{money(shift.total_sales_calculated)}</span></span>
                                    <span className="text-gray-400">Refunds: <span className="text-red-400 font-mono">-{money(shift.total_refunded)}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeShifts.length === 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center text-gray-500">
                            No cashiers currently have an active shift.
                        </div>
                    )}
                </div>
            )}

            {!loading && activeTab === 'audit' && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-sm">
                            {auditLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-gray-700/30">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{log.full_name || log.username}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">@{log.username}</div>
                                    </td>
                                    <td className="p-4 text-blue-400">{log.action}</td>
                                    <td className="p-4 text-gray-300">{log.details || '-'}</td>
                                    <td className="p-4 text-gray-500 font-mono text-xs">{log.ip_address}</td>
                                    <td className="p-4 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {auditLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No audit logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {shiftReport && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between no-print">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ReceiptText className="text-yellow-400" />
                                Shift #{shiftReport.shift.id} Report
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                >
                                    <Printer size={16} />
                                    Print Report
                                </button>
                                <button
                                    onClick={() => setShiftReport(null)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div id="shift-report-print-area" className="bg-white text-black p-6 font-mono text-sm">
                            <div className="text-center border-b border-black pb-3 mb-3">
                                <div className="font-bold text-lg">SPARXG MOTOSHOP</div>
                                <div className="font-bold">SHIFT Z-READING REPORT</div>
                                <div>{shiftReport.shift.branch_name}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
                                <div>Shift ID: #{shiftReport.shift.id}</div>
                                <div>Cashier: {shiftReport.shift.cashier_name}</div>
                                <div>Started: {formatDateTime(shiftReport.shift.start_time)}</div>
                                <div>Ended: {formatDateTime(shiftReport.shift.end_time)}</div>
                                <div>Duration: {formatDuration(shiftReport.shift.duration_minutes)}</div>
                                <div>Status: {shiftReport.shift.status}</div>
                            </div>

                            <div className="border-y border-black py-2 mb-4 space-y-1">
                                <div className="flex justify-between"><span>Starting Cash</span><span>{money(shiftReport.shift.starting_cash)}</span></div>
                                <div className="flex justify-between"><span>Cash Sales</span><span>{money(shiftReport.shift.cash_sales)}</span></div>
                                <div className="flex justify-between"><span>GCash Sales</span><span>{money(shiftReport.shift.gcash_sales)}</span></div>
                                <div className="flex justify-between"><span>Total Refunds</span><span>-{money(shiftReport.shift.total_refunded)}</span></div>
                                <div className="flex justify-between font-bold border-t border-black pt-1"><span>Expected Drawer</span><span>{money(shiftReport.shift.expected_cash)}</span></div>
                                <div className="flex justify-between"><span>Ending Cash</span><span>{money(shiftReport.shift.ending_cash)}</span></div>
                                <div className="flex justify-between font-bold"><span>Difference</span><span>{money(shiftReport.shift.difference)}</span></div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center border-b border-black pb-3 mb-4">
                                <div>
                                    <div className="font-bold">{shiftReport.shift.txn_count}</div>
                                    <div className="text-xs">Transactions</div>
                                </div>
                                <div>
                                    <div className="font-bold">{shiftReport.shift.items_sold}</div>
                                    <div className="text-xs">Items Sold</div>
                                </div>
                                <div>
                                    <div className="font-bold">{money(shiftReport.shift.total_sales_calculated)}</div>
                                    <div className="text-xs">Total Sales</div>
                                </div>
                            </div>

                            <div className="font-bold mb-2">TRANSACTIONS</div>
                            <table className="w-full text-xs mb-4">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th className="text-left py-1">Time</th>
                                        <th className="text-left py-1">Transaction</th>
                                        <th className="text-left py-1">Method</th>
                                        <th className="text-right py-1">Items</th>
                                        <th className="text-right py-1">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftReport.transactions.map((txn) => (
                                        <tr key={txn.transaction_id} className="border-b border-gray-300">
                                            <td className="py-1">{new Date(txn.created_at).toLocaleTimeString()}</td>
                                            <td className="py-1">{txn.transaction_id}</td>
                                            <td className="py-1">{txn.payment_method}</td>
                                            <td className="py-1 text-right">{txn.item_count}</td>
                                            <td className="py-1 text-right">{money(txn.total)}</td>
                                        </tr>
                                    ))}
                                    {shiftReport.transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-3 text-center">No transactions.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {shiftReport.returns.length > 0 && (
                                <>
                                    <div className="font-bold mb-2">RETURNS</div>
                                    <table className="w-full text-xs mb-4">
                                        <thead>
                                            <tr className="border-b border-black">
                                                <th className="text-left py-1">Time</th>
                                                <th className="text-left py-1">Transaction</th>
                                                <th className="text-right py-1">Refund</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shiftReport.returns.map((ret) => (
                                                <tr key={ret.id} className="border-b border-gray-300">
                                                    <td className="py-1">{new Date(ret.created_at).toLocaleTimeString()}</td>
                                                    <td className="py-1">{ret.transaction_id}</td>
                                                    <td className="py-1 text-right">-{money(ret.total_refund)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            <div className="text-center border-t border-black pt-3 text-xs">
                                Printed: {new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
