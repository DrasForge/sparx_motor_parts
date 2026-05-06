import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader, Search, Copy, ArrowRight, Home, AlertCircle } from 'lucide-react';

const CopyProductModal = ({ isOpen, onClose, onSuccess, targetBranchId }) => {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [sourceBranch, setSourceBranch] = useState('');
    const [search, setSearch] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            axios.get('/api/settings/update_branch.php').then(res => {
                setBranches(res.data.filter(b => b.id != targetBranchId));
            });
            resetForm();
        }
    }, [isOpen, targetBranchId]);

    const resetForm = () => {
        setSourceBranch('');
        setSearch('');
        setProducts([]);
        setSelectedProduct(null);
        setError('');
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 1 && sourceBranch && (!selectedProduct || search !== selectedProduct.name)) {
                setSearchLoading(true);
                axios.get(`/api/inventory/read.php?search=${search}&branch_id=${sourceBranch}&limit=5`)
                    .then(res => setProducts(res.data.data))
                    .finally(() => setSearchLoading(false));
            } else {
                setProducts([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, sourceBranch, selectedProduct]);

    const handleCopy = async () => {
        if (!selectedProduct) return;
        setLoading(true);
        setError('');

        try {
            // In our system, "copying" means creating an inventory record for the target branch
            // using the existing SKU.
            await axios.post('/api/inventory/adjust_stock.php', {
                sku: selectedProduct.sku,
                branch_id: targetBranchId,
                user_id: 1, // System/Admin
                adjustment_type: 'add',
                quantity: 0, // Initial stock is 0 as requested
                reason: 'stock_in',
                notes: `Copied from Branch ID: ${sourceBranch}`
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to copy product');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Copy size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Copy Product</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-400">Copy an existing product's SKU and details from another branch into your current branch.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Source Branch</label>
                            <div className="relative">
                                <select
                                    value={sourceBranch}
                                    onChange={(e) => {
                                        setSourceBranch(e.target.value);
                                        setSelectedProduct(null);
                                        setSearch('');
                                    }}
                                    className="w-full p-3 pl-10 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="">Select source...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Search Product</label>
                            <div className="relative">
                                <input
                                    disabled={!sourceBranch}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                                    placeholder="Type SKU or Name..."
                                />
                                {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={18} />}
                            </div>

                            {products.length > 0 && (
                                <div className="absolute z-20 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                    {products.map(p => (
                                        <button
                                            key={p.sku}
                                            onClick={() => {
                                                setSelectedProduct(p);
                                                setSearch(p.name);
                                                setProducts([]);
                                            }}
                                            className="w-full p-3 text-left hover:bg-blue-600/10 border-b border-gray-800 last:border-0 text-sm text-white"
                                        >
                                            <div className="font-bold">{p.name}</div>
                                            <div className="text-xs text-gray-500">{p.sku}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Copying details:</span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">READY</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">SKU</span>
                                    <span className="text-white font-mono">{selectedProduct.sku}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Name</span>
                                    <span className="text-white truncate block">{selectedProduct.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Selling Price</span>
                                    <span className="text-emerald-400 font-bold">₱{parseFloat(selectedProduct.price).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Supplier</span>
                                    <span className="text-white truncate block">{selectedProduct.supplier_info || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-blue-500/10 flex items-center gap-2 text-[10px] text-yellow-500 font-medium italic">
                                <AlertCircle size={12} /> Category and Stock will NOT be copied.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold text-sm uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!selectedProduct || loading}
                            onClick={handleCopy}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white font-bold text-sm uppercase flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                            {loading ? 'Copying...' : 'Copy to Branch'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopyProductModal;
