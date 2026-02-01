import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, CheckCircle, XCircle, Clock, Plus, Loader } from 'lucide-react';
import TransferModal from '../components/TransferModal';

const Logistics = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const [filter, setFilter] = useState('all'); 

    
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(user?.branch_id || 1);

    
    useEffect(() => {
        if (user.role === 'admin') {
            axios.get('/api/settings/update_branch.php')
                .then(res => setBranches(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            
            const branchId = user.role === 'admin' ? selectedBranchId : (user?.branch_id || '');

            const res = await axios.get(`/api/logistics/read_transfers.php?branch_id=${branchId}&role=${user.role}`);
            setTransfers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, [user, selectedBranchId]);

    const handleApproval = async (id, status) => {
        try {
            await axios.post('/api/logistics/update_transfer.php', {
                id,
                status,
                approved_by: user.id
            });
            fetchTransfers();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-yellow-500/10 text-yellow-500',
            approved: 'bg-emerald-500/10 text-emerald-500',
            rejected: 'bg-red-500/10 text-red-500'
        };
        const icons = {
            pending: <Clock size={14} />,
            approved: <CheckCircle size={14} />,
            rejected: <XCircle size={14} />
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${styles[status]}`}>
                {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const filteredTransfers = transfers.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'pending') return t.status === 'pending';
        return t.status !== 'pending';
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Logistics & Transfers</h1>
                    <p className="text-gray-400 text-sm">Manage stock movement between branches.</p>
                </div>
                <div className="flex gap-4">
                    {user.role === 'admin' && (
                        <select
                            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
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
                        New Request
                    </button>
                </div>
            </div>

            {}
            <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
                {['all', 'pending', 'history'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${filter === f ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {}
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader className="animate-spin text-blue-500" size={32} />
                </div>
            ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">From</th>
                                <th className="p-4">To</th>
                                <th className="p-4">Qty</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Requested By</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredTransfers.map(t => (
                                <tr key={t.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-gray-400">#{t.id}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-white">{t.product_name}</div>
                                        <div className="text-xs text-gray-500">{t.sku}</div>
                                    </td>
                                    <td className="p-4 text-gray-300">{t.source_branch_name}</td>
                                    <td className="p-4 text-gray-300">{t.dest_branch_name}</td>
                                    <td className="p-4 text-white font-bold">{t.quantity}</td>
                                    <td className="p-4"><StatusBadge status={t.status} /></td>
                                    <td className="p-4 text-sm text-gray-400">{t.requested_by_name}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {t.status === 'pending' && (user.role === 'admin' || user.role === 'inventory_manager') && (
                                            <>
                                                <button
                                                    onClick={() => handleApproval(t.id, 'approved')}
                                                    className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleApproval(t.id, 'rejected')}
                                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransfers.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">
                                        No transfers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <TransferModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTransfers}
            />
        </div>
    );
};

export default Logistics;
