import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Plus, Trash2, Edit2, Shield, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'cashier',
        branch_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users/read.php');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/api/settings/update_branch.php');
            setBranches(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.post('/api/users/delete.php?id=' + id);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, admin_id: user.id };

            if (editingUser) {
                await axios.post('/api/users/update.php', { ...payload, id: editingUser.id });
            } else {
                await axios.post('/api/users/create.php', payload);
            }
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            branch_id: user.branch_id || ''
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            role: 'cashier',
            branch_id: ''
        });
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">User Management</h1>
                    <p className="text-gray-400 text-sm">Manage access and permissions.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading users...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative group hover:border-blue-500/50 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{user.username}</h3>
                                        <span className="text-xs uppercase tracking-wider text-gray-500">{user.role.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg">
                                <MapPin size={14} />
                                {user.branch_name || 'All Branches (Admin)'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">{editingUser ? 'Edit User' : 'Create User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Role</label>
                                <select
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="cashier">Cashier</option>
                                    <option value="inventory_manager">inventory_manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Assigned Branch</label>
                                <select
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={formData.branch_id}
                                    onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                                >
                                    <option value="">None (Global/Admin)</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                                >
                                    Save User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
