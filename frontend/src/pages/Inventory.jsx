import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Plus, Filter, ArrowLeft, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import BarcodeViewer from '../components/BarcodeViewer';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingBarcode, setViewingBarcode] = useState(null);
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

    const fetchInventory = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            
            const branchId = user.role === 'admin' ? selectedBranchId : (user?.branch_id || 1);

            const res = await axios.get(`/api/inventory/read.php?page=${page}&limit=12&search=${debouncedSearch}&branch_id=${branchId}`);
            setProducts(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
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
        if (qty === 0) return { label: 'Out of Stock', color: 'text-red-400 bg-red-400/10' };
        if (qty <= reorder) return { label: 'Low Stock', color: 'text-yellow-400 bg-yellow-400/10' };
        return { label: 'In Stock', color: 'text-emerald-400 bg-emerald-400/10' };
    };

    return (
        <div>
            {}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
                    <p className="text-gray-400 text-sm">Manage products, stock levels, and prices across branches.</p>
                </div>
                <div className="flex gap-4">
                    {user.role === 'admin' && (
                        <select
                            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                            value={selectedBranchId}
                            onChange={(e) => {
                                setSelectedBranchId(Number(e.target.value));
                                setPagination(prev => ({ ...prev, current_page: 1 })); 
                            }}
                        >
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            {}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by SKU or Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 outline-none text-white transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 text-gray-300 hover:text-white rounded-lg hover:border-gray-500 transition-all">
                    <Filter size={20} />
                    Filters
                </button>
            </div>

            {}
            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <Loader className="animate-spin text-blue-500" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => {
                        const status = getStockStatus(product.quantity, product.reorder_point);
                        return (
                            <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                        {product.category?.substring(0, 2) || 'NA'}
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold mb-1 line-clamp-1 text-white group-hover:text-blue-400 transition-colors">{product.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{product.sku}</p>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Price</span>
                                        <span className="font-bold text-white">₱ {parseFloat(product.price).toLocaleString()}</span>
                                        {user.role === 'admin' && (
                                            <span className="text-[10px] text-yellow-500 font-mono mt-1">Cost: ₱{parseFloat(product.cost_price || 0).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs text-gray-400">Stock</span>
                                        <span className="font-bold text-white">{product.quantity}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingProduct(product);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setViewingBarcode(product)}
                                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                                    >
                                        Barcode
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {}
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
            />

            <BarcodeViewer
                isOpen={!!viewingBarcode}
                onClose={() => setViewingBarcode(null)}
                sku={viewingBarcode?.sku}
                name={viewingBarcode?.name}
            />
        </div>
    );
};

export default Inventory;
