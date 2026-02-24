import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSuccess, initialData, branch_id }) => {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        price: '',
        cost_price: '',
        supplier: '',
        stock_quantity: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    id: initialData.id,
                    sku: initialData.sku,
                    name: initialData.name,
                    category: initialData.category || '',
                    price: initialData.price,
                    cost_price: initialData.cost_price || '',
                    supplier: initialData.supplier_info || '',
                    stock_quantity: initialData.stock_quantity || 0
                });
            } else {
                setFormData({ sku: '', name: '', category: '', price: '', cost_price: '', supplier: '', stock_quantity: 0 });
            }
            setError('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = { ...formData, branch_id: branch_id };
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
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-fadeIn">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">SKU</label>
                            <input
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                placeholder="PROD-001"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Category</label>
                            <input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                placeholder="Engine"
                            />
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
                        <label className="text-sm font-bold text-blue-400">Stock Quantity (Current Branch)</label>
                        <input
                            type="number"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                            className="w-full p-2 bg-gray-900 border border-blue-500/30 rounded-lg text-white font-mono"
                            placeholder="0"
                        />
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
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center gap-2"
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
