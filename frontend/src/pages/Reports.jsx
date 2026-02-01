import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Package } from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview'); 
    const [topProducts, setTopProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') fetchTopProducts();
        if (activeTab === 'transactions') fetchTransactions();
        if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab, selectedBranch]);

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
            const res = await axios.get(`/api/reports/transactions.php?branch_id=${selectedBranch}`);
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

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                    <p className="text-gray-400">Detailed insights into your sales performance.</p>
                </div>

                {}
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

            {}
            <div className="flex border-b border-gray-700 mb-8">
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
                    onClick={() => setActiveTab('audit')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'audit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Audit Logs
                </button>
            </div>

            {loading && <div className="text-center py-10 text-gray-500 animate-pulse">Loading data...</div>}

            {!loading && activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {}
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

                    {}
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
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
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
                                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs uppercase font-bold">
                                                {txn.status}
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
                                    <td className="p-4 font-bold text-white">{log.username || `User #${log.user_id}`}</td>
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
        </div>
    );
};

export default Reports;
