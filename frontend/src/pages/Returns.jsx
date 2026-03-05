import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Search, History, CheckCircle, XCircle, ArrowRightLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Returns = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [saleData, setSaleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [returnItems, setReturnItems] = useState({});
    const [totalRefundedToday, setTotalRefundedToday] = useState(0);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [recentReturns, setRecentReturns] = useState([]);
    const [shift, setShift] = useState(null);

    // Initial load for today's refund total
    useEffect(() => {
        if (user?.branch_id) {
            fetchTotalRefunded();
            fetchRecentReturns();
            checkShift();
        }
    }, [user]);

    const checkShift = async () => {
        try {
            const res = await axios.get(`/api/shifts/check_status.php?user_id=${user.id}`);
            if (res.data.status === 'open') {
                setShift(res.data.data);
            }
        } catch (err) {
            console.error("Failed to check shift status:", err);
        }
    };

    const fetchTotalRefunded = async () => {
        try {
            const res = await axios.get(`/api/sales/get_total_refunded.php?branch_id=${user.branch_id}`);
            setTotalRefundedToday(res.data.total_refunded_today);
        } catch (err) {
            console.error("Failed to fetch total refunded:", err);
        }
    };

    const fetchRecentReturns = async () => {
        try {
            const res = await axios.get(`/api/sales/get_recent_returns.php?branch_id=${user.branch_id}`);
            setRecentReturns(res.data);
        } catch (err) {
            console.error("Failed to fetch recent returns:", err);
        }
    };

    // Keyed by product_id
    // {
    //    quantityToReturn: number,
    //    condition: 'good' | 'damaged'
    // }

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSaleData(null);
        setReturnItems({});

        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`/api/sales/get_sale.php?transaction_id=${trimmedQuery}`);
            setSaleData(res.data);

            // Initialize return items map
            const initialReturns = {};
            res.data.items.forEach(item => {
                initialReturns[item.product_id] = {
                    quantityToReturn: 0,
                    condition: 'good'
                };
            });
            setReturnItems(initialReturns);
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction not found.');
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (productId, value, maxReturnable) => {
        let val = parseInt(value) || 0;
        if (val < 0) val = 0;
        if (val > maxReturnable) val = maxReturnable;

        setReturnItems(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                quantityToReturn: val
            }
        }));
    };

    const handleConditionChange = (productId, condition) => {
        setReturnItems(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                condition
            }
        }));
    };

    const calculateTotalRefund = () => {
        if (!saleData) return 0;
        let total = 0;
        saleData.items.forEach(item => {
            const returnedInfo = returnItems[item.product_id];
            if (returnedInfo && returnedInfo.quantityToReturn > 0) {
                total += returnedInfo.quantityToReturn * parseFloat(item.price_at_sale);
            }
        });
        return total;
    };

    const handleProcessReturn = async () => {
        if (!window.confirm("Are you sure you want to process this return?")) return;

        const itemsToReturn = [];
        saleData.items.forEach(item => {
            const returnedInfo = returnItems[item.product_id];
            if (returnedInfo && returnedInfo.quantityToReturn > 0) {
                itemsToReturn.push({
                    product_id: item.product_id,
                    quantity: returnedInfo.quantityToReturn,
                    refund_amount: returnedInfo.quantityToReturn * parseFloat(item.price_at_sale),
                    condition_status: returnedInfo.condition,
                    branch_id: saleData.branch_id
                });
            }
        });

        if (itemsToReturn.length === 0) {
            setError("No items selected for return.");
            return;
        }

        const payload = {
            sale_id: saleData.id,
            cashier_id: user.id,
            shift_id: shift?.id,
            total_refund: calculateTotalRefund(),
            items: itemsToReturn
        };

        try {
            setLoading(true);
            await axios.post('/api/sales/process_return.php', payload);
            alert("Return processed successfully!");
            setSearchQuery('');
            setSaleData(null);
            setReturnItems({});
            fetchTotalRefunded();
            fetchRecentReturns();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process return.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-32px)] bg-[#0f1014] text-white overflow-hidden relative rounded-2xl border border-gray-800 shadow-2xl p-6">
            <div className="mb-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-1">Returns & Refunds</h1>
                    <p className="text-gray-400 text-sm">Process item returns, restock good items, or record damages.</p>
                </div>
                <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex items-center gap-3 bg-blue-900/40 hover:bg-blue-800/50 transition-colors p-3 rounded-xl border border-blue-500/30 text-left cursor-pointer"
                >
                    <History className="text-blue-400" />
                    <div className="text-sm">
                        <div className="text-gray-400">Total Refunded Today</div>
                        <div className="font-bold text-lg font-mono">₱{totalRefundedToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6 shrink-0">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            className="w-full bg-gray-900 border-2 border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-blue-500 outline-none font-mono text-lg uppercase"
                            placeholder="ENTER TRANSACTION ID (e.g. TRX-XXXX-XXXX)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!searchQuery || loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Find Transaction'}
                    </button>
                </form>
                {error && <div className="mt-4 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center gap-2"><XCircle size={18} /> {error}</div>}
            </div>

            {saleData && (
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                        <div>
                            <div className="font-mono font-bold text-gray-800 text-lg uppercase">{saleData.transaction_id}</div>
                            <div className="text-sm text-gray-500 flex gap-4">
                                <span>Cashier: <span className="font-bold text-gray-700">{saleData.cashier_name}</span></span>
                                <span>Date: <span className="font-bold text-gray-700">{new Date(saleData.created_at).toLocaleString()}</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Original Total</div>
                            <div className="font-mono text-xl font-bold text-blue-600">₱{parseFloat(saleData.total).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-left text-gray-900 border-collapse">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0 border-b border-gray-200">
                                <tr>
                                    <th className="p-3 font-bold">Item / SKU</th>
                                    <th className="p-3 font-bold text-center">Unit Price</th>
                                    <th className="p-3 font-bold text-center">Qty Bought</th>
                                    <th className="p-3 font-bold text-center">Previously Returned</th>
                                    <th className="p-3 font-bold text-center bg-blue-50">Return Qty</th>
                                    <th className="p-3 font-bold text-center bg-blue-50">Condition</th>
                                    <th className="p-3 font-bold text-right bg-blue-50">Refund Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm font-medium">
                                {saleData.items.map(item => {
                                    const maxReturnable = item.quantity - parseInt(item.returned_qty);
                                    const returnedInfo = returnItems[item.product_id];
                                    const qtyToReturn = returnedInfo ? returnedInfo.quantityToReturn : 0;
                                    const refundAmt = qtyToReturn * parseFloat(item.price_at_sale);

                                    return (
                                        <tr key={item.product_id} className={`hover:bg-gray-50 ${maxReturnable === 0 ? 'opacity-50 bg-gray-50' : ''}`}>
                                            <td className="p-3">
                                                <div className="font-bold text-gray-800">{item.name}</div>
                                                <div className="text-xs font-mono text-gray-500">{item.sku}</div>
                                            </td>
                                            <td className="p-3 text-center font-mono">₱{parseFloat(item.price_at_sale).toLocaleString()}</td>
                                            <td className="p-3 text-center text-lg">{item.quantity}</td>
                                            <td className="p-3 text-center text-red-500 font-bold">{item.returned_qty > 0 ? item.returned_qty : '-'}</td>

                                            <td className="p-3 text-center align-middle bg-blue-50/30">
                                                {maxReturnable > 0 ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxReturnable}
                                                        value={qtyToReturn}
                                                        onChange={(e) => handleQtyChange(item.product_id, e.target.value, maxReturnable)}
                                                        className="w-20 text-center border-2 border-gray-300 rounded-lg p-1 font-bold text-lg outline-none focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Fully Returned</span>
                                                )}
                                            </td>
                                            <td className="p-3 bg-blue-50/30">
                                                {maxReturnable > 0 && qtyToReturn > 0 && (
                                                    <select
                                                        value={returnedInfo?.condition || 'good'}
                                                        onChange={(e) => handleConditionChange(item.product_id, e.target.value)}
                                                        className="w-full border-2 border-gray-300 rounded-lg p-1.5 align-middle outline-none focus:border-blue-500 text-sm cursor-pointer"
                                                    >
                                                        <option value="good">Good (Restock)</option>
                                                        <option value="damaged">Damaged (No Restock)</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-red-500 text-lg bg-blue-50/30">
                                                {qtyToReturn > 0 ? `₱${refundAmt.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-100 p-4 border-t border-gray-300 flex justify-between items-center shrink-0">
                        <div className="text-gray-500 text-sm">
                            To process an <strong className="text-gray-800 uppercase">exchange</strong>, process the return here first, then ring up the new item in POS.
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-right">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Refund</div>
                                <div className="font-mono text-3xl font-bold text-red-600">₱{calculateTotalRefund().toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                            <button
                                onClick={handleProcessReturn}
                                disabled={calculateTotalRefund() === 0 || loading}
                                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 text-lg font-bold rounded-xl flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50"
                            >
                                <ArrowRightLeft size={20} />
                                Process Return
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!saleData && !loading && !error && (
                <div className="flex-1 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500">
                    <History size={64} className="mb-4 text-gray-700" />
                    <p className="text-xl font-bold">Search for a transaction to process returns.</p>
                </div>
            )}

            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
                            <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-3">
                                <History className="text-blue-400" />
                                Refund History (Today)
                            </h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white transition-colors">
                                <LogOut size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto rounded-xl border border-gray-700">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4 font-bold">Transaction ID</th>
                                            <th className="p-4 font-bold">Time</th>
                                            <th className="p-4 font-bold">Cashier</th>
                                            <th className="p-4 font-bold text-right bg-blue-500/10 text-blue-400">Refund Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700 text-sm bg-gray-800">
                                        {recentReturns.map((ret) => (
                                            <tr key={ret.id} className="hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 font-mono text-white font-bold">{ret.transaction_id}</td>
                                                <td className="p-4 text-gray-400">{new Date(ret.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="p-4 text-gray-300">{ret.cashier_name}</td>
                                                <td className="p-4 text-right font-bold text-red-400 font-mono text-lg bg-blue-500/5">
                                                    ₱{parseFloat(ret.total_refund).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        {recentReturns.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                                                    <History size={48} className="opacity-20" />
                                                    No returns processed today.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;
