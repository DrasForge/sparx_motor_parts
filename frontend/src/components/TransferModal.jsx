import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TransferModal = ({ isOpen, onClose, onSuccess }) => {
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    
    const [productId, setProductId] = useState('');
    const [sourceBranch, setSourceBranch] = useState('');
    const [destBranch, setDestBranch] = useState(user?.branch_id || '');
    const [quantity, setQuantity] = useState(1);

    const [sourceStock, setSourceStock] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        
        axios.get('/api/logistics/branch_stock.php').then(res => setBranches(res.data));
    }, []);

    
    useEffect(() => {
        if (search.length > 2) {
            axios.get(`/api/inventory/read.php?search=${search}&limit=5`).then(res => {
                setProducts(res.data.data);
            });
        }
    }, [search]);

    
    useEffect(() => {
        if (productId && sourceBranch) {
            axios.get(`/api/logistics/branch_stock.php?product_id=${productId}`).then(res => {
                const branch = res.data.find(b => b.branch_id == sourceBranch);
                setSourceStock(branch ? branch.quantity : 0);
            });
        } else {
            setSourceStock(null);
        }
    }, [productId, sourceBranch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (sourceBranch == destBranch) {
            setError("Source and Destination branches must be different.");
            setLoading(false);
            return;
        }

        if (sourceStock !== null && quantity > sourceStock) {
            setError(`Insufficient stock at source branch (Available: ${sourceStock}).`);
            setLoading(false);
            return;
        }

        try {
            await axios.post('/api/logistics/create_transfer.php', {
                product_id: productId,
                source_branch_id: sourceBranch,
                dest_branch_id: destBranch,
                quantity: quantity,
                requested_by: user.id
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request transfer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-fadeIn">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Request Stock Transfer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Search Product</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            placeholder="Type SKU or Name..."
                        />
                        {}
                        {search.length > 2 && products.length > 0 && (
                            <div className="max-h-40 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg mt-1">
                                {products.map(p => (
                                    <div
                                        key={p.id}
                                        className={`p-2 cursor-pointer hover:bg-blue-600/20 ${productId === p.id ? 'bg-blue-600/30' : ''}`}
                                        onClick={() => {
                                            setProductId(p.id);
                                            setSearch(p.name);
                                            setProducts([]); 
                                        }}
                                    >
                                        <div className="text-sm text-white">{p.name}</div>
                                        <div className="text-xs text-gray-500">{p.sku}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Source Branch</label>
                            <select
                                value={sourceBranch}
                                onChange={(e) => setSourceBranch(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Dest Branch</label>
                            <select
                                value={destBranch}
                                onChange={(e) => setDestBranch(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {sourceStock !== null && (
                        <div className="p-2 bg-gray-700/50 rounded-lg text-xs text-center border border-gray-600">
                            Available Stock at Source: <span className="font-bold text-white">{sourceStock}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
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
                            Submit Request
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default TransferModal;
