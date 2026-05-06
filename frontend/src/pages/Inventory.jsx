import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Plus, Filter, ArrowLeft, ArrowRight, Loader, PackageSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import BarcodeViewer from '../components/BarcodeViewer';
import AdjustmentModal from '../components/AdjustmentModal';
import CopyProductModal from '../components/CopyProductModal';
import { Copy } from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState(null);
    const [viewingBarcode, setViewingBarcode] = useState(null);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0 });
    const [search, setSearch] = useState('');
    const { user, loading: authLoading } = useAuth();

    if (authLoading || !user) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0F1014] text-white">
                <Loader className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(user?.branch_id || 1);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (user.role === 'admin') {
            axios.get('/api/settings/update_branch.php')
                .then(res => setBranches(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const fetchInventory = useCallback(async (page = 1, forceBranchId = null) => {
        setLoading(true);
        try {
            const branchId = forceBranchId !== null ? forceBranchId : (user.role === 'admin' ? selectedBranchId : (user?.branch_id || 1));
            const res = await axios.get(`/api/inventory/read.php?page=${page}&limit=12&search=${debouncedSearch}&branch_id=${branchId}`);
            setProducts(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
            setProducts([]);
            setPagination({ current_page: 1, total_pages: 1, total_items: 0 });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, user, selectedBranchId]);

    useEffect(() => {
        fetchInventory(pagination.current_page);
    }, [fetchInventory]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setPagination(prev => ({ ...prev, current_page: newPage }));
            fetchInventory(newPage);
        }
    };

    const getStockStatus = (qty, reorder) => {
        const numericQty = Number(qty) || 0;
        const numericReorder = Number(reorder) || 0;
        if (numericQty <= 0) return { label: 'Out of Stock', color: 'text-red-400 bg-red-400/10' };
        if (numericQty <= numericReorder) return { label: 'Low Stock', color: 'text-yellow-400 bg-yellow-400/10' };
        return { label: 'In Stock', color: 'text-emerald-400 bg-emerald-400/10' };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-gray-400 text-sm">
                            Viewing <span className="text-blue-400 font-bold underline">ID: {user.role === 'admin' ? selectedBranchId : user.branch_id}</span> across branches.
                        </p>
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400">
                            {pagination.total_items} Total Products
                        </span>
                    </div>
                </div>
                <div className="flex gap-4">
                    {user.role === 'admin' && (
                        <div className="relative group">
                            <select
                                className="bg-gray-800 border border-gray-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none block w-48 p-3 appearance-none cursor-pointer transition-all hover:border-gray-500 shadow-lg"
                                value={selectedBranchId}
                                onChange={(e) => {
                                    const newBranchId = Number(e.target.value);
                                    setSelectedBranchId(newBranchId);
                                    setPagination(prev => ({ ...prev, current_page: 1 }));
                                    fetchInventory(1, newBranchId);
                                }}
                            >
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name} (ID: {branch.id})</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-white transition-colors">
                                <Filter size={16} />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCopyModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl font-medium transition-all"
                    >
                        <Copy size={20} />
                        Copy Product
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-sparx-yellow hover:bg-white text-black rounded-xl shadow-lg shadow-sparx-yellow/10 font-bold transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 flex gap-4 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by SKU or Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white transition-all placeholder:text-gray-600"
                    />
                </div>
                <button className="flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all shadow-md">
                    <Filter size={18} />
                    <span className="text-sm font-semibold uppercase tracking-wider">Advanced</span>
                </button>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="animate-spin text-blue-500" size={48} />
                        <p className="text-gray-500 font-medium animate-pulse">Syncing Inventory...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => {
                        const stockQty = Number(product.stock_quantity) || 0;
                        const status = getStockStatus(stockQty, product.reorder_point);
                        return (
                            <div key={product.sku} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden flex flex-col h-full shadow-xl hover:shadow-blue-900/10">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color} border border-white/5`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xs uppercase mb-4 border border-blue-500/20">
                                        {product.category_name?.substring(0, 2) || 'NA'}
                                    </div>
                                    <h3 className="text-xl font-bold mb-1 text-white group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3.5rem] leading-tight">{product.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono tracking-tighter uppercase">{product.sku}</p>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="flex justify-between items-end bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Selling Price</span>
                                            <span className="text-lg font-bold text-white tracking-tight">₱ {parseFloat(product.price).toLocaleString()}</span>
                                            {user.role === 'admin' && (
                                                <span className="text-[9px] text-yellow-500/70 font-mono mt-1">COGS: ₱{parseFloat(product.cost_price || 0).toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Stock</span>
                                            <span className={`text-2xl font-bold font-mono ${stockQty > 0 ? 'text-white' : 'text-red-500'}`}>{stockQty}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setAdjustingProduct(product);
                                                setIsAdjustmentOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs text-blue-400 font-bold transition-all"
                                        >
                                            <PackageSearch size={14} /> Adjust Stock
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingProduct(product);
                                                setIsModalOpen(true);
                                            }}
                                            className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white transition-colors"
                                        >
                                            Edit Details
                                        </button>
                                        <button
                                            onClick={() => setViewingBarcode(product)}
                                            className="col-span-2 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 transition-colors"
                                        >
                                            View Barcode
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && (
                <div className="flex justify-between items-center bg-gray-800/50 p-4 border border-gray-700 rounded-xl">
                    <span className="text-gray-400 text-sm">
                        Showing page <span className="text-white font-bold">{pagination.current_page}</span> of {pagination.total_pages}
                        <span className="ml-2">({pagination.total_items} items)</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.current_page === 1}
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            className="p-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            disabled={pagination.current_page === pagination.total_pages}
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            className="p-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
                onSuccess={() => fetchInventory(pagination.current_page)}
                initialData={editingProduct}
                branch_id={user.role === 'admin' ? selectedBranchId : (user?.branch_id || 1)}
            />

            <AdjustmentModal
                isOpen={isAdjustmentOpen}
                onClose={() => { setIsAdjustmentOpen(false); setAdjustingProduct(null); }}
                onSuccess={() => fetchInventory(pagination.current_page)}
                product={adjustingProduct}
                branchId={user.role === 'admin' ? selectedBranchId : (user?.branch_id || 1)}
            />

            <BarcodeViewer
                isOpen={!!viewingBarcode}
                onClose={() => setViewingBarcode(null)}
                sku={viewingBarcode?.sku}
                name={viewingBarcode?.name}
            />

            <CopyProductModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onSuccess={() => fetchInventory(1)}
                targetBranchId={user.role === 'admin' ? selectedBranchId : (user?.branch_id || 1)}
            />
        </div>
    );
};

export default Inventory;
