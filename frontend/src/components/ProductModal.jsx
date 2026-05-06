import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Loader, PlusCircle, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProductModal = ({ isOpen, onClose, onSuccess, initialData, branch_id }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category_id: '',
        price: '',
        cost_price: '',
        supplier: '',
        stock_quantity: 0,
        branch_id: branch_id || 1,
        is_quick_access: 0
    });
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);

    // SKU verification states
    const [isSkuChecking, setIsSkuChecking] = useState(false);
    const [skuStatus, setSkuStatus] = useState(null); // 'available', 'taken', null

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchBranches();
            const defaultBranch = user.role !== 'admin' ? (user.branch_id || 1) : (branch_id || 1);
            if (initialData) {
                setFormData({
                    sku: initialData.sku,
                    name: initialData.name,
                    category_id: initialData.category_id || '',
                    price: initialData.price,
                    cost_price: initialData.cost_price || '',
                    supplier: initialData.supplier_info || '',
                    stock_quantity: initialData.stock_quantity || 0,
                    branch_id: defaultBranch,
                    is_quick_access: initialData.is_quick_access || 0
                });
                setSkuStatus(null);
            } else {
                setFormData({ 
                    sku: '', 
                    name: '', 
                    category_id: '', 
                    price: '', 
                    cost_price: '', 
                    supplier: '', 
                    stock_quantity: 0, 
                    branch_id: defaultBranch,
                    is_quick_access: 0
                });
                setSkuStatus(null);
            }
            setError('');
        }
    }, [isOpen, initialData, branch_id]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/settings/categories.php');
            setCategories(res.data);
            if (res.data.length === 0) {
                setShowAddCategory(true);
            }
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/api/settings/update_branch.php');
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to fetch branches');
        }
    };

    const checkSkuAvailability = useCallback(async (sku) => {
        if (!sku || initialData) return;
        setIsSkuChecking(true);
        try {
            const res = await axios.get(`/api/inventory/check_sku.php?sku=${sku}`);
            setSkuStatus(res.data.exists ? 'taken' : 'available');
        } catch (err) {
            console.error('SKU check failed');
        } finally {
            setIsSkuChecking(false);
        }
    }, [initialData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.sku && !initialData) {
                checkSkuAvailability(formData.sku);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.sku, checkSkuAvailability, initialData]);

    const handleGenerateSku = async () => {
        try {
            const res = await axios.get('/api/inventory/generate_sku.php');
            setFormData({ ...formData, sku: res.data.sku });
            setSkuStatus('available');
        } catch (err) {
            setError('Failed to generate SKU');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        try {
            await axios.post('/api/settings/categories.php', { name: newCategoryName });
            setNewCategoryName('');
            setShowAddCategory(false);
            fetchCategories();
        } catch (err) {
            setError('Failed to create category');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category_id) {
            setError('Please select a category.');
            return;
        }
        if (!initialData && skuStatus === 'taken') {
            setError('SKU is already taken.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const payload = { ...formData, user_id: user.id };
            if (initialData) {
                await axios.post('/api/inventory/update_product.php', payload);
            } else {
                await axios.post('/api/inventory/create_product.php', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-300">SKU (Primary Key)</label>
                                {!initialData && (
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateSku}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} /> Generate
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    required
                                    disabled={!!initialData}
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    className={`w-full p-2 bg-gray-900 border ${skuStatus === 'taken' ? 'border-red-500' : skuStatus === 'available' ? 'border-emerald-500' : 'border-gray-600'} rounded-lg text-white disabled:opacity-50`}
                                    placeholder="PROD-001"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isSkuChecking ? <Loader size={14} className="animate-spin text-gray-400" /> : 
                                     skuStatus === 'available' ? <Check size={14} className="text-emerald-500" /> :
                                     skuStatus === 'taken' ? <AlertCircle size={14} className="text-red-500" /> : null}
                                </div>
                            </div>
                            {skuStatus === 'taken' && <p className="text-[10px] text-red-500 font-medium">SKU already exists in the system.</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-300">Category</label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddCategory(!showAddCategory)}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <PlusCircle size={12} /> {showAddCategory ? 'Cancel' : 'New'}
                                </button>
                            </div>
                            
                            {showAddCategory ? (
                                <div className="flex gap-2">
                                    <input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="flex-1 p-2 bg-gray-900 border border-blue-500/50 rounded-lg text-sm text-white"
                                        placeholder="New Category..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="px-3 bg-blue-600 text-white rounded-lg text-xs"
                                    >
                                        Add
                                    </button>
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Product Name</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            placeholder="e.g. Brake Pads for Yamaha"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Selling Price</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-bold text-emerald-400"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-yellow-500">Cost Price (COGS)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.cost_price}
                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                className="w-full p-2 bg-gray-900 border border-yellow-500/50 rounded-lg text-white"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Supplier</label>
                            <input
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                placeholder="Supplier Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Branch (Initial Stock)</label>
                            <select
                                value={formData.branch_id}
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                disabled={user.role !== 'admin'}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white disabled:opacity-75 disabled:bg-gray-800"
                            >
                                {branches
                                    .filter(b => user.role === 'admin' || b.id == user.branch_id)
                                    .map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-blue-400">Stock Quantity</label>
                        <input
                            type="number"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                            className="w-full p-2 bg-gray-900 border border-blue-500/30 rounded-lg text-white font-mono"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_quick_access"
                            checked={formData.is_quick_access === 1}
                            onChange={(e) => setFormData({ ...formData, is_quick_access: e.target.checked ? 1 : 0 })}
                            className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                        />
                        <label htmlFor="is_quick_access" className="text-sm font-bold text-gray-300 cursor-pointer">
                            Easy Access (Show as button in POS Terminal)
                        </label>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || categories.length === 0 || (!initialData && skuStatus === 'taken')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg text-white font-medium flex items-center gap-2"
                        >
                            {loading && <Loader className="animate-spin" size={16} />}
                            {initialData ? 'Update Product' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
