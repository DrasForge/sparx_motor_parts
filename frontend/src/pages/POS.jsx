import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, CheckCircle } from 'lucide-react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, LogOut, ArrowLeft, Activity, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';

const POS = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();


    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null); // Staged product
    const [qtyInput, setQtyInput] = useState(1);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [cart, setCart] = useState([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [quickAccessProducts, setQuickAccessProducts] = useState([]);


    const [shift, setShift] = useState(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');
    const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
    const [endingCash, setEndingCash] = useState('');
    const [shiftSummary, setShiftSummary] = useState(null);
    const [reconciliationStats, setReconciliationStats] = useState(null);


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


    const getLocalDateString = () => {
        const now = new Date();
        const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0];
    };

    const fetchRecentSales = useCallback(async () => {
        if (!user) return;

        try {
            const today = getLocalDateString();
            const res = await axios.get(`/api/reports/transactions.php?branch_id=${user.branch_id || 1}&start_date=${today}&end_date=${today}`);
            setRecentSales(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setRecentSales([]);
        }
    }, [user]);

    const openSalesHistory = () => {
        setIsHistoryModalOpen(true);
        fetchRecentSales();
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

    const handleReprint = async (transactionId) => {
        try {
            const res = await axios.get(`/api/sales/get_sale.php?transaction_id=${transactionId}`);
            const saleData = res.data;

            setReceiptData({
                transaction_id: saleData.transaction_id,
                cashier: saleData.cashier_name,
                branch: user.branch_name || 'Branch',
                items: saleData.items.map(item => ({
                    sku: item.product_sku || item.sku,
                    name: item.name,
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price_at_sale)
                })),
                total: parseFloat(saleData.total_amount),
                payment_method: saleData.payment_method,
                amount_tendered: parseFloat(saleData.amount_tendered || saleData.total_amount),
                change: parseFloat(saleData.amount_tendered || saleData.total_amount) - parseFloat(saleData.total_amount),
                date: new Date(saleData.created_at)
            });
            setIsHistoryModalOpen(false);
        } catch (err) {
            alert("Failed to fetch sale details: " + (err.response?.data?.message || err.message));
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
        const countedCash = parseFloat(endingCash) || 0;
        let expectedCash = reconciliationStats ? parseFloat(reconciliationStats.expected_cash) : null;

        if (expectedCash === null && shift?.id) {
            try {
                const statsRes = await axios.get(`/api/shifts/get_shift_stats.php?shift_id=${shift.id}`);
                setReconciliationStats(statsRes.data);
                expectedCash = parseFloat(statsRes.data.expected_cash);
            } catch (err) {
                console.error("Failed to fetch shift stats before ending shift", err);
            }
        }

        if (expectedCash !== null && countedCash < expectedCash) {
            const shortage = expectedCash - countedCash;
            const shouldContinue = window.confirm(
                `The entered ending cash is short by ₱${shortage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Are you sure you want to continue with a short amount?`
            );

            if (!shouldContinue) return;
        }

        try {
            const res = await axios.post('/api/shifts/end_shift.php', {
                shift_id: shift.id,
                user_id: user.id,
                ending_cash: countedCash
            });
            setShiftSummary(res.data.data);
            setShift(null);
            setIsEndShiftModalOpen(false);
            alert("Shift Ended Successfully!");
            navigate('/dashboard');

        } catch (err) {
            alert("Failed to end shift: " + err.message);
        }
    };


    useEffect(() => {
        const fetchQuickAccess = async () => {
            try {
                const res = await axios.get(`/api/pos/search_products.php?quick=1&branch_id=${user.branch_id || 1}&limit=20`);
                setQuickAccessProducts(res.data);
            } catch (err) {
                console.error("Failed to fetch quick access products", err);
            }
        };
        if (user) fetchQuickAccess();
    }, [user]);

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
            const existing = prev.find(item => item.sku === productToAdd.sku);
            if (existing) {
                const newTotalQty = existing.quantity + qtyToAdd;
                if (newTotalQty > availableStock) {
                    alert(`Cannot add more! Total requested (${newTotalQty}) exceeds stock (${availableStock}).`);
                    return prev;
                }
                return prev.map(item => item.sku === productToAdd.sku ? { ...item, quantity: newTotalQty } : item);
            }
            return [...prev, { ...sanitizedProduct, quantity: qtyToAdd }];
        });

        cancelSelection(productOverride ? false : true);
    };

    const cancelSelection = (shouldFocus = true) => {
        setSelectedProduct(null);
        setQtyInput(1);
        setSearch('');
        if (shouldFocus && searchRef.current) {
            searchRef.current.focus();
        }
    };

    const handleScanSuccess = (sku) => {
        setIsScannerOpen(false);
        setSearch(sku);
        axios.get(`/api/pos/search_products.php?search=${sku}&branch_id=${user.branch_id || 1}&limit=5`)
            .then(res => {
                const exactMatch = res.data.find(p => p.sku === sku);
                if (exactMatch) {
                    addToCart(exactMatch, 1);
                } else if (res.data.length === 1) {
                    addToCart(res.data[0], 1);
                } else {
                    setSearchResults(res.data);
                }
            })
            .catch(console.error);
    };

    const [receiptData, setReceiptData] = useState(null);

    const removeFromCart = (sku) => {
        setCart(prev => prev.filter(item => item.sku !== sku));
    };

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    }, [cart]);

    const handlePayment = async (paymentDetails) => {
        try {
            const cartSnapshot = [...cart];
            const payload = {
                branch_id: user.branch_id || 1,
                user_id: user.id,
                shift_id: shift?.id,
                customer_name: "Walk-in",
                total_amount: total,
                payment_method: paymentDetails.method,
                items: cart.map(item => ({
                    product_sku: item.sku,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const res = await axios.post('/api/sales/create_sale.php', payload);

            setReceiptData({
                transaction_id: res.data.transaction_id,
                cashier: user.username,
                branch: user.branch_name || 'Branch',
                items: cartSnapshot,
                total,
                payment_method: paymentDetails.method,
                amount_tendered: paymentDetails.amount_tendered,
                change: paymentDetails.amount_tendered - total,
                date: new Date()
            });
            setCart([]);
            setIsPaymentOpen(false);
            cancelSelection();
        } catch (err) {
            alert("Transaction Failed: " + (err.response?.data?.message || err.message));
        }
    };

    // Helper for status badge colors (includes refund statuses)
    const getStatusBadge = (status) => {
        const map = {
            voided: 'bg-red-500/10 text-red-500',
            refunded: 'bg-blue-500/10 text-blue-400',
            partial_refund: 'bg-yellow-500/10 text-yellow-400',
        };
        return map[status] || 'bg-green-500/10 text-green-400';
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0f1014] text-white overflow-y-auto relative pb-20">

            {/* Header */}
            <div className="bg-[#0a0a0c] p-3 flex justify-between items-center shadow-lg z-20 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="SparxG" className="h-10 object-contain" />
                    {user?.branch_name && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-sparx-yellow/10 text-sparx-yellow rounded-full border border-sparx-yellow/30 shadow-lg shadow-sparx-yellow/10">
                            <Activity size={14} className="animate-pulse" />
                            <span className="text-[12px] font-black uppercase tracking-widest">{user.branch_name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-sparx-yellow flex items-center justify-center text-black font-bold">
                        <User size={18} />
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="font-bold text-sm text-white">{user?.username}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user?.role}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-2 space-y-2">

                {/* Search Bar + Product Detail Panel */}
                <div className="bg-gray-800/50 rounded-xl p-3 md:p-4 border border-gray-700/50 shadow-xl backdrop-blur-sm shrink-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 mb-4 relative">
                        <label className="text-base md:text-lg font-bold text-gray-300 w-full md:w-32 shrink-0">Search Product:</label>
                        <div className="relative flex-1 w-full">
                            <input
                                ref={searchRef}
                                type="text"
                                disabled={isShiftModalOpen || isEndShiftModalOpen || isPaymentOpen || isHistoryModalOpen}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`w-full bg-gray-200 text-gray-900 text-lg md:text-xl font-mono px-4 py-2 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none uppercase placeholder:text-gray-400 ${isShiftModalOpen || isEndShiftModalOpen || isPaymentOpen || isHistoryModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="BARCODE / NAME"
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
                                        <div
                                            key={prod.id}
                                            onClick={() => selectProduct(prod)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between"
                                        >
                                            <span className="font-bold">{prod.name}</span>
                                            <span className="font-mono text-blue-600">{formatPrice(prod.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Products */}
                    {quickAccessProducts.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-gray-700/50">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block tracking-widest">Easy Access Items</label>
                            <div className="flex flex-wrap gap-2">
                                {quickAccessProducts.map(p => (
                                    <button
                                        key={p.sku}
                                        onClick={() => addToCart(p, 1)}
                                        className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 hover:text-white transition-all whitespace-nowrap flex items-center gap-2 active:scale-95 shadow-lg"
                                    >
                                        <Plus size={14} />
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedProduct ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="md:col-span-8 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:gap-4">
                                    <span className="text-gray-400 w-32 shrink-0 font-medium text-sm sm:text-base">Product Name:</span>
                                    <span className="text-lg md:text-xl text-white font-bold tracking-wide break-words">
                                        {selectedProduct.name} <span className="text-gray-500 block sm:inline">| {selectedProduct.sku}</span>
                                    </span>
                                </div>
                                <div className="hidden sm:flex gap-4">
                                    <span className="text-gray-400 w-32 shrink-0 font-medium">Description:</span>
                                    <span className="text-gray-300 italic line-clamp-1">{selectedProduct.description || 'No description available.'}</span>
                                </div>
                                <div className="flex gap-2 md:gap-4 mt-2">
                                    <button onClick={cancelSelection} className="flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg border border-gray-600 text-gray-400 font-bold hover:bg-gray-700 hover:text-white transition-all uppercase text-xs">
                                        CANCEL
                                    </button>
                                    <button onClick={() => addToCart()} className="flex-1 sm:flex-none px-6 md:px-8 py-2 rounded-lg bg-sparx-yellow text-black font-bold hover:bg-white transition-all shadow-lg shadow-sparx-yellow/20 uppercase text-xs">
                                        ADD ITEM
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-4 bg-gray-900/50 p-3 rounded-xl border border-gray-700 space-y-2">
                                <div className="flex justify-between text-base md:text-lg">
                                    <span className="text-gray-400">Price:</span>
                                    <span className="font-mono text-yellow-400">{formatPrice(selectedProduct.price)}</span>
                                </div>
                                <div className="flex justify-between text-base md:text-lg">
                                    <span className="text-gray-400">Stock:</span>
                                    <span className={`font-mono ${selectedProduct.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedProduct.quantity}</span>
                                </div>
                                <div className="flex justify-between items-center text-base md:text-lg pt-2 border-t border-gray-700">
                                    <span className="text-gray-400">Quantity:</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setQtyInput(q => Math.max(1, q - 1))} className="p-1 bg-gray-700 rounded hover:bg-gray-600"><Minus size={16}/></button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedProduct.quantity}
                                            value={qtyInput}
                                            onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)}
                                            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-white font-bold outline-none"
                                        />
                                        <button onClick={() => setQtyInput(q => Math.min(selectedProduct.quantity, q + 1))} className="p-1 bg-gray-700 rounded hover:bg-gray-600"><Plus size={16}/></button>
                                    </div>
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-700 text-right">
                                    <span className="text-gray-400 text-xs md:text-sm mr-2">TOTAL:</span>
                                    <span className="text-lg md:text-xl font-bold text-white">{formatPrice(selectedProduct.price * qtyInput)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-16 md:h-24 flex items-center justify-center text-gray-600 border-2 border-dashed border-gray-700 rounded-xl text-sm px-4 text-center">
                            Select a product to view details
                        </div>
                    )}
                </div>

                {/* Cart Table */}
                <div className="bg-white text-gray-900 flex-1 rounded-t-xl overflow-hidden flex flex-col shadow-2xl min-h-[400px]">
                    <div className="bg-gray-100 p-2 text-center text-xs font-bold tracking-widest text-gray-500 border-b border-gray-300 uppercase shrink-0">Transaction Table</div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                            <thead className="bg-[#f8f9fa] text-[10px] md:text-xs font-bold text-gray-500 uppercase sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-2 md:p-3 border-b border-r w-[45%] md:w-[40%]">Item</th>
                                    <th className="p-2 md:p-3 border-b border-r text-center w-[15%]">Price</th>
                                    <th className="p-2 md:p-3 border-b border-r text-center w-[10%] md:w-[15%]">Qty</th>
                                    <th className="p-2 md:p-3 border-b border-r text-right w-[15%]">Total</th>
                                    <th className="p-2 md:p-3 border-b text-right w-[10%] md:w-[15%]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.sku} className="border-b hover:bg-blue-50 transition-colors group">
                                        <td className="p-2 md:p-3 border-r font-medium text-gray-800 text-xs md:text-sm">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-gray-400 text-[10px]">{item.sku}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-3 border-r text-center font-mono text-xs md:text-sm">{parseFloat(item.price).toFixed(2)}</td>
                                        <td className="p-2 md:p-3 border-r text-center font-bold text-xs md:text-sm">{item.quantity}</td>
                                        <td className="p-2 md:p-3 border-r text-right font-mono font-bold text-xs md:text-sm">{parseFloat(item.price * item.quantity).toFixed(2)}</td>
                                        <td className="p-2 md:p-3 text-right">
                                            <button onClick={() => removeFromCart(item.sku)} className="text-gray-400 hover:text-red-500 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400 italic text-sm">No items in cart</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-stretch md:items-end p-0 shrink-0">
                    <div className="order-2 md:order-1 md:col-span-5 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                onClick={openSalesHistory}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-1 rounded-lg border border-gray-600 shadow text-[10px] md:text-xs uppercase"
                            >
                                History
                            </button>
                            <button
                                onClick={() => setCart([])}
                                disabled={cart.length === 0}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-1 rounded-lg border border-gray-600 shadow text-[10px] md:text-xs uppercase disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-1 rounded-lg border border-gray-600 shadow text-[10px] md:text-xs uppercase"
                            >
                                Scan
                            </button>
                            <button
                                onClick={() => setIsEndShiftModalOpen(true)}
                                className="bg-red-900/50 hover:bg-red-900/80 text-red-200 font-bold py-2.5 px-1 rounded-lg border border-red-900/50 shadow text-[10px] md:text-xs uppercase"
                            >
                                End Shift
                            </button>
                        </div>

                        <div className="block">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Discount Code:</label>
                            <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 font-mono text-xs focus:border-blue-500 outline-none"
                                placeholder="ENTER CODE..."
                            />
                        </div>
                    </div>

                    {/* Grand Total + Tender */}
                    <div className="order-1 md:order-2 md:col-span-7 flex flex-col justify-end space-y-2">
                        <div className="flex items-center justify-between md:justify-end gap-4 bg-white text-gray-900 p-2 md:p-3 rounded-lg border-2 border-gray-300">
                            <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px] md:text-xs">Grand Total:</span>
                            <span className="text-xl md:text-2xl font-bold font-mono text-[#0F1014]">{formatPrice(total)}</span>
                        </div>
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={cart.length === 0}
                            className="w-full py-3 md:py-4 bg-sparx-yellow text-black hover:bg-white font-black text-lg md:text-xl tracking-widest rounded-xl shadow-xl shadow-sparx-yellow/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            TENDER
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={total}
                onConfirm={handlePayment}
            />
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />

            {/* Sales History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h2 className="text-xl md:text-2xl font-bold text-white">Sales History (Today)</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 md:p-6">
                            <div className="min-w-[600px]">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/50 text-gray-400 text-[10px] md:text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-3 md:p-4">Txn ID</th>
                                            <th className="p-3 md:p-4">Time</th>
                                            <th className="p-3 md:p-4">Customer</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700 text-xs md:text-sm">
                                        {recentSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-700/30">
                                                <td className="p-3 md:p-4 font-mono text-blue-400">{sale.transaction_id}</td>
                                                <td className="p-3 md:p-4 text-gray-300">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="p-3 md:p-4 text-gray-300">{sale.customer_name}</td>
                                                <td className="p-3 md:p-4 text-right font-bold text-white">₱{parseFloat(sale.total).toLocaleString()}</td>
                                                <td className="p-3 md:p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-[4px] text-[10px] uppercase font-bold ${getStatusBadge(sale.status)}`}>
                                                        {sale.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-3 md:p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {sale.status === 'completed' && (
                                                            <button
                                                                onClick={() => handleReprint(sale.transaction_id)}
                                                                className="text-blue-400 hover:text-blue-300 text-[10px] uppercase font-bold border border-blue-500/30 px-3 py-1 rounded hover:bg-blue-900/20 transition-colors"
                                                            >
                                                                Reprint
                                                            </button>
                                                        )}
                                                        {sale.status !== 'voided' && (user.role === 'admin' || user.role === 'manager') && (
                                                            <button
                                                                onClick={() => handleVoidSale(sale.id)}
                                                                className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold border border-red-500/30 px-3 py-1 rounded hover:bg-red-900/20 transition-colors"
                                                            >
                                                                Void
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {recentSales.length === 0 && (
                                            <tr><td colSpan="6" className="p-8 text-center text-gray-500 italic">No sales transactions found for today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Shift Modal */}
            {isShiftModalOpen && (
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
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 text-gray-500 hover:text-gray-300 font-bold transition-colors uppercase tracking-widest text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Shift Modal */}
            {isEndShiftModalOpen && (
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
                                                <div className="flex justify-between text-red-400">
                                                    <span>Cash Refunds:</span>
                                                    <span className="font-mono">-₱{parseFloat(reconciliationStats.total_refunded || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                                        <div className="flex justify-between text-gray-600"><span>Txn Count:</span><span>{shiftSummary.txn_count}</span></div>
                                        <div className="flex justify-between font-bold"><span>Total Sales:</span><span>₱{parseFloat(shiftSummary.total_sales).toFixed(2)}</span></div>
                                        <div className="flex justify-between text-red-600"><span>Total Refunds:</span><span>-₱{parseFloat(shiftSummary.total_refunded || 0).toFixed(2)}</span></div>
                                        <div className="border-b border-black my-1"></div>
                                        <div className="flex justify-between font-bold text-lg"><span>Net Cash:</span><span>₱{(parseFloat(shiftSummary.total_sales) - parseFloat(shiftSummary.total_refunded || 0)).toFixed(2)}</span></div>
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
            )}

            {/* Receipt Modal */}
            {receiptData && (() => {
                const vatRate = 0.12;
                const vatableSales = receiptData.total / (1 + vatRate);
                const vatAmount = receiptData.total - vatableSales;
                const amountTendered = parseFloat(receiptData.amount_tendered || receiptData.total);
                const change = receiptData.payment_method === 'cash' ? Math.max(0, amountTendered - receiptData.total) : 0;

                return (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="flex flex-col gap-4 w-full max-w-xs my-auto">
                            {/* The Receipt */}
                            <div id="receipt-print-area" className="bg-white text-black font-mono text-xs leading-relaxed shadow-2xl" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                                {/* Store Header */}
                                <div className="text-center py-4 px-4 border-b-2 border-dashed border-gray-400">
                                    <div className="text-lg font-bold tracking-widest">SParx</div>
                                    <div className="text-xs font-bold tracking-wider">MOTORPARTS & ACCESSORIES</div>
                                    <div className="text-xs text-gray-600 mt-1">{user?.branch_name || 'Main Branch'}</div>
                                    <div className="text-xs text-gray-500">Tel: (XXX) XXX-XXXX</div>
                                </div>

                                {/* Non-BIR Disclaimer */}
                                <div className="text-center py-2 px-4 bg-gray-100 border-b border-dashed border-gray-400">
                                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">⚠ NOT BIR REGISTERED ⚠</div>
                                    <div className="text-xs text-gray-500">For Internal Monitoring Only</div>
                                    <div className="text-xs text-gray-500">This is NOT an official receipt.</div>
                                </div>

                                {/* Transaction Info */}
                                <div className="px-4 pt-3 pb-1 border-b border-dashed border-gray-300">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Date:</span>
                                        <span>{receiptData.date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Time:</span>
                                        <span>{receiptData.date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Cashier:</span>
                                        <span>{receiptData.cashier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">SI No.:</span>
                                        <span className="text-xs">{receiptData.transaction_id}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="px-4 pt-2 pb-2 border-b border-dashed border-gray-300">
                                    <div className="flex justify-between text-gray-500 text-xs mb-1 uppercase">
                                        <span>Description</span>
                                        <span>Amount</span>
                                    </div>
                                    {receiptData.items.map((item, i) => (
                                        <div key={i} className="mb-1.5">
                                            <div className="font-bold truncate">{item.name}</div>
                                            <div className="flex justify-between text-gray-700">
                                                <span>&nbsp;&nbsp;{item.quantity} pc(s) @ ₱{parseFloat(item.price).toFixed(2)}</span>
                                                <span>₱{(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="px-4 py-2 border-b border-dashed border-gray-300 space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">VATable Sales:</span>
                                        <span>₱{vatableSales.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">VAT (12%):</span>
                                        <span>₱{vatAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">VAT-Exempt Sales:</span>
                                        <span>₱0.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Zero-Rated Sales:</span>
                                        <span>₱0.00</span>
                                    </div>
                                    <div className="border-t border-gray-300 mt-1 pt-1 flex justify-between font-bold text-sm">
                                        <span>TOTAL DUE:</span>
                                        <span>₱{receiptData.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="px-4 py-2 border-b border-dashed border-gray-300 space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Payment ({receiptData.payment_method?.toUpperCase()}):</span>
                                        <span>₱{amountTendered.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Change:</span>
                                        <span>₱{change.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="text-center py-4 px-4 text-xs text-gray-500 space-y-1">
                                    <div>Items Sold: {receiptData.items.reduce((s, i) => s + i.quantity, 0)}</div>
                                    <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
                                        <div className="font-bold text-gray-700">Thank you for your purchase!</div>
                                        <div>No returns after 7 days.</div>
                                        <div>Goods once sold are not returnable</div>
                                        <div>without original receipt.</div>
                                    </div>
                                    <div className="border-t border-dashed border-gray-300 pt-2 mt-2 text-gray-400">
                                        <div>*** NOT AN OFFICIAL RECEIPT ***</div>
                                        <div>NOT BIR REGISTERED</div>
                                        <div>FOR INTERNAL MONITORING ONLY</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (outside print area) */}
                            <div className="flex gap-3 no-print">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow border border-gray-300"
                                >
                                    <Printer size={18} />
                                    Print Receipt
                                </button>
                                <button
                                    onClick={() => setReceiptData(null)}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow"
                                >
                                    New Sale
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default POS;
