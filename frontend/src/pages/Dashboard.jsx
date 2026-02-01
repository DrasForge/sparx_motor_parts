import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    DollarSign, ShoppingBag, AlertTriangle, TrendingUp
} from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();

    
    const [adminData, setAdminData] = useState([]);

    
    const [metrics, setMetrics] = useState({ sales_today: 0, orders_today: 0, low_stock: 0, recent_sales: [] });
    const [chartData, setChartData] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user.role === 'admin') {
                    
                    const res = await axios.get('/api/analytics/branch_performance.php');
                    setAdminData(res.data);
                } else {
                    
                    const branchId = user.branch_id || '';
                    const [metricsRes, chartRes] = await Promise.all([
                        axios.get(`/api/analytics/dashboard_metrics.php?branch_id=${branchId}`),
                        axios.get(`/api/analytics/sales_chart.php?days=7&branch_id=${branchId}`)
                    ]);
                    setMetrics(metricsRes.data);
                    setChartData(chartRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Live refresh every 5s
        return () => clearInterval(interval);
    }, [user]);

    const KPITile = ({ icon: Icon, label, value, color }) => (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between group hover:border-gray-600 transition-all">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                    {value}
                </h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    );

    const BranchCard = ({ data }) => (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                {data.name}
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Sales:</span>
                    <span className="text-emerald-400 font-semibold">{data.items_sold} sold today</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Transactions:</span>
                    <span className="text-blue-400 font-semibold">{data.transaction_count} transactions today</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Sales:</span>
                    <span className="text-white font-bold">₱ {parseFloat(data.total_sales).toLocaleString()} today</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                    <span className="text-gray-400 text-sm">Low Stock Alert:</span>
                    <span className={`font-bold ${data.low_stock > 0 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                        {data.low_stock}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{user?.username}</span>
                        <span className="ml-4 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full animate-pulse border border-red-500/20">● LIVE</span>
                    </h1>
                    <p className="text-gray-400">
                        {user.role === 'admin' ? 'Overview of all branch performance.' : "Here is what's happening in your branch today."}
                    </p>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-400 border border-gray-700">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {user.role === 'admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminData.map(branch => (
                        <BranchCard key={branch.id} data={branch} />
                    ))}
                    {adminData.length === 0 && !loading && (
                        <p className="text-gray-500">No branches found.</p>
                    )}
                </div>
            ) : (
                <>
                    {}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <KPITile
                            icon={DollarSign}
                            label="Today's Sales"
                            value={`₱ ${parseFloat(metrics.sales_today).toLocaleString()}`}
                            color="bg-emerald-500/10 text-emerald-500"
                        />
                        <KPITile
                            icon={ShoppingBag}
                            label="Transaction Count"
                            value={metrics.orders_today}
                            color="bg-blue-500/10 text-blue-500"
                        />
                        <KPITile
                            icon={AlertTriangle}
                            label="Low Stock Alert"
                            value={`${metrics.low_stock} Items`}
                            color="bg-yellow-500/10 text-yellow-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {}
                        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-500" />
                                    Sales Trend (Last 7 Days)
                                </h3>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#60A5FA' }}
                                            formatter={(value) => [`₱ ${parseFloat(value).toLocaleString()}`, 'Sales']}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-6">Recent Sales</h3>
                            <div className="space-y-4">
                                {metrics.recent_sales.map((sale) => (
                                    <div key={sale.id} className="flex justify-between items-start pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-white font-medium">{sale.customer_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 font-bold">+₱{parseFloat(sale.total_amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">#{sale.id}</p>
                                        </div>
                                    </div>
                                ))}
                                {metrics.recent_sales.length === 0 && (
                                    <p className="text-gray-500 text-sm">No sales today yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
