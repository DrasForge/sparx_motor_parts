import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Loader, Search, AlertCircle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TransferModal = ({ isOpen, onClose, onSuccess }) => {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const { user } = useAuth();

    // Form State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [sourceBranch, setSourceBranch] = useState('');
    const [destBranch, setDestBranch] = useState(user?.branch_id || '');
    const [quantity, setQuantity] = useState(1);

    const [sourceStock, setSourceStock] = useState(null);
    const [destStock, setDestStock] = useState(null); // Track if product exists in destination
    const [checkingStock, setCheckingStock] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAssignPrompt, setShowAssignPrompt] = useState(false); // Prompt for new assignment
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch branches
        axios.get('/api/settings/update_branch.php').then(res => setBranches(res.data));
    }, []);

    // Debounced Product Search - Now Includes branch_id
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 1 && sourceBranch && (!selectedProduct || search !== selectedProduct.name)) {
                setSearchLoading(true);
                axios.get(`/api/inventory/read.php?search=${search}&branch_id=${sourceBranch}&limit=5`)
                    .then(res => {
                        setProducts(Array.isArray(res.data.data) ? res.data.data : []);
                    })
                    .finally(() => setSearchLoading(false));
            } else {
                setProducts([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, selectedProduct, sourceBranch]);

    // Real-time Stock Check (Sync when branch changes)
    useEffect(() => {
        if (selectedProduct) {
            setCheckingStock(true);
            axios.get(`/api/logistics/branch_stock.php?product_sku=${selectedProduct.sku}`)
                .then(res => {
                    const sBranch = res.data.find(b => b.branch_id == sourceBranch);
                    const dBranch = res.data.find(b => b.branch_id == destBranch);
                    
                    setSourceStock(sBranch ? Number(sBranch.quantity) : 0);
                    setDestStock(dBranch ? Number(dBranch.quantity) : null); // null means not assigned yet
                })
                .finally(() => setCheckingStock(false));
        } else {
            setSourceStock(null);
            setDestStock(null);
        }
    }, [selectedProduct, sourceBranch, destBranch]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedProduct) return;
        
        setError('');

        if (sourceBranch == destBranch) {
            setError("Source and Destination branches must be different.");
            return;
        }

        if (sourceStock !== null && quantity > sourceStock) {
            setError(`Insufficient stock at source branch (Available: ${sourceStock}).`);
            return;
        }

        // Check if product exists in destination. If not, show prompt unless already confirmed.
        if (destStock === null && !showAssignPrompt) {
            setShowAssignPrompt(true);
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/logistics/create_transfer.php', {
                product_sku: selectedProduct.sku,
                source_branch_id: sourceBranch,
                dest_branch_id: destBranch,
                quantity: quantity,
                requested_by: user.id
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request transfer');
            setShowAssignPrompt(false); // Reset prompt on error
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Search size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Stock Transfer Request</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 1. Branch Selection (Source and Destination) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Source (From)</label>
                            <div className="relative">
                                <select
                                    required
                                    value={sourceBranch}
                                    onChange={(e) => {
                                        setSourceBranch(e.target.value);
                                        setSelectedProduct(null); // Reset product when branch changes
                                        setSearch('');
                                    }}
                                    className="w-full p-4 pl-10 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="">Select Origin...</option>
                                    {Array.isArray(branches) && branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Destination (To)</label>
                            <div className="relative">
                                <select
                                    required
                                    value={destBranch}
                                    onChange={(e) => setDestBranch(e.target.value)}
                                    className="w-full p-4 pl-10 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="">Select Destination...</option>
                                    {Array.isArray(branches) && branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Product Search (Only active if sourceBranch is selected) */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                            Search Product {sourceBranch && <span className="text-blue-400 text-[10px] ml-2">Searching in Source Branch</span>}
                        </label>
                        <div className="relative">
                            <input
                                disabled={!sourceBranch}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`w-full p-4 bg-gray-900 border ${!sourceBranch ? 'border-gray-800 opacity-50 cursor-not-allowed' : selectedProduct ? 'border-emerald-500/50' : 'border-gray-700'} rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                                placeholder={sourceBranch ? "Type SKU or Name..." : "Select source branch first"}
                            />
                            {searchLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader className="animate-spin text-blue-500" size={20} />
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown - Shows stock in source branch */}
                        {products.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                {products.map(p => (
                                    <button
                                        key={p.sku}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setSearch(p.name);
                                            setProducts([]);
                                            setSourceStock(p.stock_quantity); // Direct set from search result
                                        }}
                                        className="w-full p-4 text-left hover:bg-blue-600/10 border-b border-gray-800 last:border-0 transition-colors group flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">{p.sku}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold px-2 py-1 rounded ${p.stock_quantity > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {p.stock_quantity} in stock
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Selected Product & Real-time Stock UI */}
                    {selectedProduct && (
                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${checkingStock ? 'bg-gray-800 border-gray-700' : sourceStock > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {checkingStock ? (
                                    <Loader className="animate-spin text-gray-400" size={20} />
                                ) : sourceStock > 0 ? (
                                    <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                                ) : (
                                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                                )}
                                <div className="truncate">
                                    <div className="text-sm font-bold text-white truncate">{selectedProduct.name}</div>
                                    <div className="text-xs text-gray-400">Available: <span className="text-white font-bold">{sourceStock ?? 0} units</span></div>
                                </div>
                            </div>
                            {!checkingStock && sourceStock <= 0 && (
                                <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded uppercase tracking-tighter">No Stock</span>
                            )}
                        </div>
                    )}

                    {/* 4. Quantity Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Transfer Quantity</label>
                        <div className="relative">
                            <input
                                required
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className={`w-full p-4 bg-gray-900 border ${sourceStock !== null && quantity > sourceStock ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                                placeholder="0"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                Qty
                            </div>
                        </div>
                        {sourceStock !== null && quantity > sourceStock && (
                            <p className="text-red-400 text-[11px] font-medium flex items-center gap-1 animate-pulse">
                                <AlertCircle size={14} /> Warning: Requested quantity exceeds available stock!
                            </p>
                        )}
                    </div>

                    {showAssignPrompt && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3 animate-pulse">
                            <div className="flex items-start gap-3 text-blue-400">
                                <AlertCircle size={20} className="shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">New Assignment Required</p>
                                    <p className="text-xs opacity-80">This product is not yet registered in the receiving branch. Proceeding will automatically add it to their inventory.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowAssignPrompt(false)}
                                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Yes, Proceed
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all text-sm uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || checkingStock || !selectedProduct || sourceStock <= 0 || quantity > sourceStock || quantity <= 0}
                            className="flex-1 px-4 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                            {loading ? 'Processing...' : 'Send Request'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default TransferModal;
