import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, LogOut, ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';

const POS = () => {
    const { user, logout } = useAuth();

    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [qtyInput, setQtyInput] = useState(1);

    const [cart, setCart] = useState([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [discountCode, setDiscountCode] = useState('');

    const [shift, setShift] = useState(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');
    const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
    const [endingCash, setEndingCash] = useState('');
    const [shiftSummary, setShiftSummary] = useState(null);
    const [reconciliationStats, setReconciliationStats] = useState(null);
    const [settings, setSettings] = useState({ tax_rate: 12 });
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        axios.get('/api/settings/config.php')
            .then(res => setSettings(prev => ({ ...prev, ...res.data })))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (isEndShiftModalOpen && shift?.id) {
            axios.get(`/api/shifts/get_shift_stats.php?shift_id=${shift.id}`)
                .then(res => setReconciliationStats(res.data))
                .catch(console.error);
        }
    }, [isEndShiftModalOpen, shift]);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [recentSales, setRecentSales] = useState([]);
    const searchRef = useRef(null);

    useEffect(() => {
        if (isHistoryModalOpen) {
            fetchRecentSales();
        }
    }, [isHistoryModalOpen]);

    const fetchRecentSales = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.get(`/api/reports/transactions.php?branch_id=${user.branch_id || 1}&start_date=${today}&end_date=${today}`);
            setRecentSales(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVoidSale = async (saleId) => {
        if (!window.confirm("Are you sure you want to VOID this sale? This will restore stock.")) return;
        try {
            await axios.post('/api/sales/void_sale.php', {
                sale_id: saleId,
                admin_id: user.id
            });
            alert("Sale Voided Successfully.");
            fetchRecentSales();
        } catch (err) {
            alert("Failed to void sale: " + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        const checkShift = async () => {
            try {
                const res = await axios.get(`/api/shifts/check_status.php?user_id=${user.id}`);
                if (res.data.status === 'open') {
                    setShift(res.data.data);
                } else {
                    setIsShiftModalOpen(true);
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (user) checkShift();
    }, [user]);

    const handleStartShift = async () => {
        try {
            const res = await axios.post('/api/shifts/start_shift.php', {
                user_id: user.id,
                branch_id: user.branch_id || 1,
                starting_cash: parseFloat(startingCash) || 0
            });
            setShift({ id: res.data.shift_id, starting_cash: startingCash });
            setIsShiftModalOpen(false);
            alert("Shift Started!");
        } catch (err) {
            alert("Failed to start shift: " + (err.response?.data?.message || err.message));
        }
    };

    const handleEndShift = async () => {
        try {
            const res = await axios.post('/api/shifts/end_shift.php', {
                shift_id: shift.id,
                user_id: user.id,
                ending_cash: parseFloat(endingCash) || 0
            });
            setShiftSummary(res.data.summary);
            setShift(null);
            setIsEndShiftModalOpen(false);
        } catch (err) {
            alert("Failed to end shift: " + err.message);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 1) {
                axios.get(`/api/pos/search_products.php?search=${search}&branch_id=${user.branch_id || 1}&limit=10`)
                    .then(res => setSearchResults(res.data))
                    .catch(console.error);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, user]);

    const formatPrice = (price) => '₱' + parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setQtyInput(1);
        setSearch('');
        setSearchResults([]);
    };

    const addToCart = (productOverride = null, quantityOverride = null) => {
        const productToAdd = productOverride || selectedProduct;
        let qtyToAdd = parseInt(quantityOverride || qtyInput, 10);

        if (!productToAdd) return;
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) qtyToAdd = 1;

        const price = parseFloat(productToAdd.price);
        if (isNaN(price)) {
            alert("Error: Invalid product price detected.");
            return;
        }

        const availableStock = parseInt(productToAdd.quantity, 10) || 0;
        if (availableStock < qtyToAdd) {
            alert(`Insufficient stock! Only ${availableStock} available.`);
            return;
        }

        const sanitizedProduct = {
            ...productToAdd,
            price: price,
            quantity: availableStock
        };

        setCart(prev => {
            const existing = prev.find(item => item.id === productToAdd.id);
            if (existing) {
                const newTotalQty = existing.quantity + qtyToAdd;
                if (newTotalQty > availableStock) {
                    alert(`Cannot add more! Total requested (${newTotalQty}) exceeds stock (${availableStock}).`);
                    return prev;
                }
                return prev.map(item => item.id === productToAdd.id ? { ...item, quantity: newTotalQty } : item);
            }
            return [...prev, { ...sanitizedProduct, quantity: qtyToAdd }];
        });

        cancelSelection();
    };

    const cancelSelection = () => {
        setSelectedProduct(null);
        setQtyInput(1);
        setSearch('');
        if (searchRef.current) searchRef.current.focus();
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        let discount = 0;
        let dtype = 'flat';
        if (discountCode.toUpperCase() === 'SAVE10') {
            discount = subtotal * 0.1;
            dtype = 'percentage';
        } else if (discountCode.toUpperCase() === 'LESS50') {
            discount = 50;
            dtype = 'flat';
        }

        const taxableAmount = subtotal - discount;
        const taxRate = parseFloat(settings.tax_rate) || 0;
        const taxAmount = taxableAmount * (taxRate / 100);
        const grandTotal = taxableAmount + taxAmount;

        return {
            subtotal,
            discount,
            discountType: dtype,
            taxAmount,
            taxRate,
            grandTotal
        };
    }, [cart, discountCode, settings.tax_rate]);

    const handlePayment = async (paymentDetails) => {
        try {
            const payload = {
                branch_id: user.branch_id || 1,
                cashier_id: user.id,
                shift_id: shift?.id || null,
                subtotal: totals.subtotal,
                tax_amount: totals.taxAmount,
                discount_amount: totals.discount,
                discount_type: totals.discountType,
                total: totals.grandTotal,
                payment_method: paymentDetails.method,
                items: cart.map(item => ({
                    id: item.id,
                    cart_quantity: item.quantity,
                    price: item.price,
                    subtotal: (parseFloat(item.price) * item.quantity)
                }))
            };

            const res = await axios.post('/api/sales/create_sale.php', payload);

            setSuccessData({
                transaction_id: res.data.transaction_id,
                total: totals.grandTotal,
                subtotal: totals.subtotal,
                tax_amount: totals.taxAmount,
                discount_amount: totals.discount,
                tax_rate: totals.taxRate,
                items: [...cart],
                payment_method: paymentDetails.method,
                date: new Date().toLocaleString()
            });

            setCart([]);
            setIsPaymentOpen(false);
            cancelSelection();
        } catch (err) {
            alert("Transaction Failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-32px)] bg-[#0f1014] text-white overflow-hidden relative rounded-2xl border border-gray-800 shadow-2xl">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 flex justify-between items-center shadow-lg z-20 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-yellow-400">SParx</h1>
                    <p className="text-xs text-blue-200 tracking-widest uppercase">Motorparts - Point of Sale</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-700/50">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-blue-900 font-bold">
                        <User size={18} />
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="font-bold text-sm text-white">{user?.username}</div>
                        <div className="text-xs text-blue-300 capitalize">{user?.role}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden relative">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-xl backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-4 mb-4 relative">
                        <label className="text-lg font-bold text-gray-300 w-32 shrink-0">Search Product:</label>
                        <div className="relative flex-1">
                            <input
                                ref={searchRef}
                                type="text"
                                disabled={isShiftModalOpen || isEndShiftModalOpen || isPaymentOpen || isHistoryModalOpen}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`w-full bg-gray-200 text-gray-900 text-xl font-mono px-4 py-2 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none uppercase placeholder:text-gray-400`}
                                placeholder="ENTER BARCODE/PRODUCT NAME"
                                autoFocus
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        if (searchResults.length === 1) {
                                            addToCart(searchResults[0], 1);
                                        } else if (search.length > 0) {
                                            try {
                                                const res = await axios.get(`/api/pos/search_products.php?search=${search}&branch_id=${user.branch_id || 1}&limit=5`);
                                                if (res.data.length > 0) {
                                                    const exactMatch = res.data.find(p => p.sku === search || p.name === search);
                                                    if (exactMatch) {
                                                        addToCart(exactMatch, 1);
                                                    } else if (res.data.length === 1) {
                                                        addToCart(res.data[0], 1);
                                                    } else {
                                                        setSearchResults(res.data);
                                                    }
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }
                                    }
                                }}
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-900 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto border-2 border-blue-500">
                                    {searchResults.map(prod => (
                                        <div key={prod.id} onClick={() => selectProduct(prod)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between">
                                            <span className="font-bold">{prod.name}</span>
                                            <span className="font-mono text-blue-600">{formatPrice(prod.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedProduct ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="md:col-span-8 space-y-2">
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-32 shrink-0 font-medium text-sm">Product Name:</span>
                                    <span className="text-xl text-white font-bold tracking-wide">{selectedProduct.name} <span className="text-gray-500 text-base">| {selectedProduct.sku}</span></span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-32 shrink-0 font-medium text-sm">Description:</span>
                                    <span className="text-gray-300 italic text-sm line-clamp-1">{selectedProduct.description || 'No description available.'}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={cancelSelection} className="px-4 py-1.5 rounded-lg border-2 border-gray-500 text-gray-300 font-bold hover:bg-gray-700 transition-colors text-sm">CANCEL</button>
                                    <button onClick={() => addToCart()} className="px-6 py-1.5 rounded-lg bg-[#002B3D] text-white border border-blue-500/30 font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 text-sm">ADD</button>
                                </div>
                            </div>
                            <div className="md:col-span-4 bg-gray-900/50 p-3 rounded-xl border border-gray-700 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Price:</span>
                                    <span className="font-mono text-yellow-400 font-bold">{formatPrice(selectedProduct.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Stock:</span>
                                    <span className={`font-mono font-bold ${selectedProduct.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedProduct.quantity}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-700">
                                    <span className="text-gray-400">Qty:</span>
                                    <input type="number" min="1" max={selectedProduct.quantity} value={qtyInput} onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)} className="w-16 bg-gray-700 border border-gray-600 rounded px-1 text-right text-white font-bold outline-none" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-16 flex items-center justify-center text-gray-600 border-2 border-dashed border-gray-700 rounded-xl text-sm italic">
                            Select a product or scan barcode to view details
                        </div>
                    )}
                </div>

                <div className="bg-white text-gray-900 flex-1 rounded-xl overflow-hidden flex flex-col shadow-2xl min-h-0 border-2 border-gray-200">
                    <div className="bg-gray-100 p-2 text-center text-xs font-bold tracking-widest text-gray-500 border-b border-gray-300 uppercase shrink-0">Transaction Table</div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8f9fa] text-[10px] font-bold text-gray-500 uppercase sticky top-0 shadow-sm">
                                <tr>
                                    <th className="p-2 border-b border-r w-[40%]">Item</th>
                                    <th className="p-2 border-b border-r text-center w-[15%]">Unit Price</th>
                                    <th className="p-2 border-b border-r text-center w-[15%]">Qty</th>
                                    <th className="p-2 border-b border-r text-right w-[15%]">Total</th>
                                    <th className="p-2 border-b text-right w-[15%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {cart.map((item, idx) => (
                                    <tr key={item.id} className="border-b hover:bg-blue-50 transition-colors">
                                        <td className="p-2 border-r font-medium text-gray-800">{item.name} <span className="text-gray-400 text-[10px]">({item.sku})</span></td>
                                        <td className="p-2 border-r text-center font-mono text-xs">{parseFloat(item.price).toFixed(2)}</td>
                                        <td className="p-2 border-r text-center font-bold">{item.quantity}</td>
                                        <td className="p-2 border-r text-right font-mono font-bold">{parseFloat(item.price * item.quantity).toFixed(2)}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr><td colSpan="5" className="p-4 text-center text-gray-400 italic text-sm">No items in cart</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-end p-0 shrink-0">
                    <div className="col-span-5 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setIsHistoryModalOpen(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg border border-gray-600 shadow text-[10px] uppercase">History</button>
                            <button onClick={() => setCart([])} disabled={cart.length === 0} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg border border-gray-600 shadow text-[10px] uppercase disabled:opacity-50">Clear</button>
                            <button onClick={() => setIsEndShiftModalOpen(true)} className="bg-red-900/50 hover:bg-red-900/80 text-red-200 font-bold py-2 rounded-lg border border-red-900/50 shadow text-[10px] uppercase">End Shift</button>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                                className="w-full bg-gray-200 text-gray-900 font-bold p-2 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none uppercase text-xs"
                                placeholder="DISCOUNT CODE"
                            />
                        </div>
                    </div>

                    <div className="col-span-7 flex flex-col justify-end space-y-2">
                        <div className="bg-white text-gray-900 p-3 rounded-lg border-2 border-gray-300 space-y-1 shadow-inner">
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                                <span>Subtotal:</span>
                                <span>{formatPrice(totals.subtotal)}</span>
                            </div>
                            {totals.discount > 0 && (
                                <div className="flex justify-between text-[10px] text-red-500 font-bold uppercase">
                                    <span>Discount:</span>
                                    <span>-{formatPrice(totals.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[10px] text-blue-600 font-bold uppercase">
                                <span>Tax ({totals.taxRate}%):</span>
                                <span>{formatPrice(totals.taxAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200 pt-1 mt-1">
                                <span className="font-bold text-gray-800 uppercase tracking-widest text-xs">Grand Total:</span>
                                <span className="text-xl font-bold font-mono text-gray-950">{formatPrice(totals.grandTotal)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-[#002B3D] text-yellow-400 hover:text-yellow-300 font-bold text-lg tracking-widest rounded-lg shadow-xl hover:bg-[#00384f] transition-all disabled:opacity-50 uppercase"
                        >
                            TENDER
                        </button>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={totals.grandTotal}
                onConfirm={handlePayment}
            />

            {
                isShiftModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-md p-8 border border-gray-700 shadow-2xl">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Start Shift</h2>
                                <p className="text-gray-400">Please enter your starting cash to begin.</p>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Starting Cash Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                                        <input
                                            type="number"
                                            value={startingCash}
                                            onChange={(e) => setStartingCash(e.target.value)}
                                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-xl py-4 pl-10 pr-4 text-white text-xl font-bold outline-none focus:border-blue-500 focus:bg-gray-800 transition-all placeholder-gray-600"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleStartShift}
                                    disabled={!startingCash}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                                >
                                    Open Register
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isEndShiftModalOpen && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-md p-8 border border-gray-700 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">End Shift & Close Register</h2>
                            <div className="space-y-6">
                                {!shiftSummary ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Ending Cash (Counted)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={endingCash}
                                                    onChange={(e) => setEndingCash(e.target.value)}
                                                    className="w-full bg-gray-900 border-2 border-gray-600 rounded-xl py-4 pl-10 pr-4 text-white text-xl font-bold outline-none focus:border-red-500 focus:bg-gray-800 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {reconciliationStats && (
                                                <div className="bg-gray-700/50 p-4 rounded-lg space-y-2 text-sm border border-gray-600 mt-2">
                                                    <div className="flex justify-between text-gray-400">
                                                        <span>Starting Cash:</span>
                                                        <span className="font-mono">₱{parseFloat(reconciliationStats.starting_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-400">
                                                        <span>Cash Sales:</span>
                                                        <span className="font-mono">₱{parseFloat(reconciliationStats.cash_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="border-t border-gray-600 my-1"></div>
                                                    <div className="flex justify-between text-white font-bold text-base">
                                                        <span>Expected In Drawer:</span>
                                                        <span className="font-mono text-yellow-400">₱{parseFloat(reconciliationStats.expected_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    {endingCash && (
                                                        <div className={`flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-600 ${parseFloat(endingCash) - parseFloat(reconciliationStats.expected_cash) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            <span>Difference:</span>
                                                            <span className="font-mono">
                                                                {parseFloat(endingCash) - parseFloat(reconciliationStats.expected_cash) >= 0 ? '+' : ''}
                                                                ₱{(parseFloat(endingCash) - parseFloat(reconciliationStats.expected_cash)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsEndShiftModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors">Cancel</button>
                                            <button
                                                onClick={handleEndShift}
                                                disabled={!endingCash}
                                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                            >
                                                End Shift
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-white text-black p-6 rounded-lg font-mono text-sm space-y-2">
                                            <div className="text-center font-bold border-b border-black pb-2 mb-2">Z-READING REPORT</div>
                                            <div className="flex justify-between"><span>Shift ID:</span><span>#{shiftSummary.shift_id}</span></div>
                                            <div className="flex justify-between"><span>Cashier:</span><span>{user.username}</span></div>
                                            <div className="border-b border-black my-2"></div>
                                            <div className="flex justify-between"><span>Txn Count:</span><span>{shiftSummary.txn_count}</span></div>
                                            <div className="flex justify-between font-bold"><span>Total Sales:</span><span>₱{parseFloat(shiftSummary.total_sales).toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Ending Cash:</span><span>₱{parseFloat(shiftSummary.ending_cash).toFixed(2)}</span></div>
                                            <div className="text-center mt-4 text-xs">** END OF REPORT **</div>
                                        </div>
                                        <button
                                            onClick={() => window.print()}
                                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg mb-2"
                                        >
                                            Print Report
                                        </button>
                                        <button
                                            onClick={() => { setShiftSummary(null); logout(); }}
                                            className="w-full py-3 border border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-500/10"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Sales History (Today)</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white transition-colors">
                                <LogOut size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Txn ID</th>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700 text-sm">
                                        {recentSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-700/30">
                                                <td className="p-4 font-mono text-blue-400">{sale.transaction_id}</td>
                                                <td className="p-4 text-gray-300">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="p-4 text-gray-300">{sale.customer_name}</td>
                                                <td className="p-4 text-right font-bold text-white">₱{parseFloat(sale.total).toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold 
                                                        ${sale.status === 'voided' ? 'bg-red-500/10 text-red-500' :
                                                            sale.status === 'refunded' ? 'bg-blue-500/10 text-blue-400' :
                                                                sale.status === 'partial_refund' ? 'bg-yellow-500/10 text-yellow-400' :
                                                                    'bg-green-500/10 text-green-400'}`}>
                                                        {sale.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {sale.status !== 'voided' && (user.role === 'admin' || user.role === 'manager') && (
                                                        <button
                                                            onClick={() => handleVoidSale(sale.id)}
                                                            className="text-red-400 hover:text-red-300 text-xs uppercase font-bold border border-red-500/30 px-3 py-1 rounded hover:bg-red-900/20 transition-colors"
                                                        >
                                                            Void
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {recentSales.length === 0 && (
                                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">No sales transactions found for today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {
                successData && (
                    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
                        <div className="bg-white text-gray-900 rounded-lg w-full max-w-sm p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden my-auto">
                            <div id="printable-receipt" className="p-6 bg-white font-mono text-[11px] leading-tight text-black">
                                <div className="text-center space-y-1 mb-4 border-b pb-4">
                                    <h2 className="text-sm font-bold uppercase">{settings.company_name || 'SPARX MOTOR PARTS'}</h2>
                                    <p className="whitespace-pre-wrap">{settings.company_address || '123 Main St, Manila'}</p>
                                    <p className="font-bold">TIN: {settings.company_tin || '000-000-000-000'}</p>
                                    <div className="flex justify-center gap-2 text-[9px] text-gray-600 mt-1">
                                        <span>S/N: {settings.machine_sn || 'SN123456789'}</span>
                                        <span>MIN: {settings.permit_no || 'PERMIT-2024-01'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4 border-b pb-2">
                                    <div className="flex justify-between uppercase">
                                        <span className="font-bold">Date:</span>
                                        <span>{successData.date}</span>
                                    </div>
                                    <div className="flex justify-between uppercase">
                                        <span className="font-bold">Invoice #:</span>
                                        <span>{successData.transaction_id}</span>
                                    </div>
                                    <div className="flex justify-between uppercase">
                                        <span className="font-bold">Cashier:</span>
                                        <span>{user.username}</span>
                                    </div>
                                </div>

                                <table className="w-full mb-4">
                                    <thead>
                                        <tr className="border-b-2 border-dashed border-gray-400">
                                            <th className="text-left py-1">QTY</th>
                                            <th className="text-left py-1">ITEM</th>
                                            <th className="text-right py-1">PRICE</th>
                                            <th className="text-right py-1">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dashed divide-gray-300">
                                        {successData.items.map((item, idx) => (
                                            <tr key={idx} className="align-top">
                                                <td className="py-2 text-center w-8">{item.quantity}</td>
                                                <td className="py-2 pr-2">{item.name}</td>
                                                <td className="py-2 text-right">{parseFloat(item.price).toFixed(2)}</td>
                                                <td className="py-2 text-right">{(item.quantity * item.price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="space-y-1 pt-2 border-t-2 border-dashed border-gray-400">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-bold">{parseFloat(successData.subtotal).toFixed(2)}</span>
                                    </div>
                                    {successData.discount_amount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount:</span>
                                            <span>-{parseFloat(successData.discount_amount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-600 italic">
                                        <span>VATable Sales:</span>
                                        <span>{(successData.subtotal - successData.discount_amount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 italic">
                                        <span>VAT Amount ({successData.tax_rate}%):</span>
                                        <span>{successData.tax_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                        <span>GRAND TOTAL:</span>
                                        <span>₱{parseFloat(successData.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-400 text-[10px] space-y-1">
                                    <div className="flex justify-between uppercase">
                                        <span>Method:</span>
                                        <span className="font-bold">{successData.payment_method}</span>
                                    </div>
                                </div>

                                <div className="text-center mt-8 space-y-1 italic text-[9px] text-gray-500 uppercase">
                                    <p>{settings.receipt_footer || 'THIS SERVES AS YOUR OFFICIAL RECEIPT.'}</p>
                                    <p>Thank you for choosing Sparx!</p>
                                    <div className="flex justify-center gap-1 mt-4">
                                        <span className="inline-block px-2 py-0.5 border border-gray-400 rounded">ORIGINAL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        const printContent = document.getElementById('printable-receipt').innerHTML;
                                        const printWindow = window.open('', '', 'height=600,width=400');
                                        printWindow.document.write('<html><head><title>Receipt</title><style>body{font-family:monospace;padding:20px;width:300px;margin:0 auto;} @media print { body { width: auto; padding: 0; } }</style></head><body>');
                                        printWindow.document.write(printContent);
                                        printWindow.document.write('</body></html>');
                                        printWindow.document.close();
                                        printWindow.focus();
                                        printWindow.print();
                                        printWindow.close();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#002B3D] hover:bg-black text-yellow-400 font-bold rounded-xl shadow-lg transition-all uppercase"
                                >
                                    <Printer size={18} />
                                    PRINT RECEIPT
                                </button>
                                <button
                                    onClick={() => setSuccessData(null)}
                                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all uppercase"
                                >
                                    DONE / NEXT SALE
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default POS;
