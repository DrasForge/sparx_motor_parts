import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader, Plus, Minus, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdjustmentModal = ({ isOpen, onClose, onSuccess, product, branchId }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        adjustment_type: 'add',
        quantity: 1,
        reason: 'stock_in',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({ adjustment_type: 'add', quantity: 1, reason: 'stock_in', notes: '' });
            setError('');
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                sku: product.sku,
                branch_id: branchId,
                user_id: user.id
            };
            await axios.post('/api/inventory/adjust_stock.php', payload);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to adjust stock');
        } finally {
            setLoading(false);
        }
    };

    const reasons = [
        { value: 'stock_in', label: 'New Stock (Stock In)', type: 'add' },
        { value: 'correction', label: 'Inventory Correction', type: 'both' },
        { value: 'damage', label: 'Damaged Item', type: 'reduce' },
        { value: 'lost', label: 'Lost / Missing', type: 'reduce' },
        { value: 'found', label: 'Found Item', type: 'add' }
    ];

    const filteredReasons = reasons.filter(r => r.type === 'both' || r.type === formData.adjustment_type);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl animate-fadeIn">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Stock Adjustment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                        <p className="text-sm text-gray-400">Product</p>
                        <p className="text-white font-bold">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, adjustment_type: 'add', reason: 'stock_in' })}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${formData.adjustment_type === 'add' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                        >
                            <Plus size={18} /> Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, adjustment_type: 'reduce', reason: 'damage' })}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${formData.adjustment_type === 'reduce' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                        >
                            <Minus size={18} /> Reduce Stock
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Quantity</label>
                        <input
                            required
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-xl font-bold font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Reason</label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                        >
                            {filteredReasons.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm"
                            rows="2"
                            placeholder="Add details about this adjustment..."
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex gap-2 text-red-400 text-sm items-start">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

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
                            className={`px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${formData.adjustment_type === 'add' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                            {loading && <Loader className="animate-spin" size={16} />}
                            {formData.adjustment_type === 'add' ? 'Confirm Addition' : 'Confirm Reduction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustmentModal;
