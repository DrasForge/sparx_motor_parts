import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Save, Lock, Building, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    const [config, setConfig] = useState({ tax_rate: '' });

    const [branches, setBranches] = useState([]);
    const [editingBranch, setEditingBranch] = useState(null);

    useEffect(() => {
        if (activeTab === 'system' && user.role === 'admin') {
            fetchConfig();
        }
        if (activeTab === 'branches' && user.role === 'admin') {
            fetchBranches();
        }
    }, [activeTab, user]);

    const fetchConfig = async () => {
        try {
            const res = await axios.get('/api/settings/config.php');
            setConfig(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/api/settings/update_branch.php');
            setBranches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordData.new !== passwordData.confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/settings/update_profile.php', {
                user_id: user.id,
                current_password: passwordData.current,
                new_password: passwordData.new
            });
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfigSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/settings/config.php', { settings: config });
            setMessage({ type: 'success', text: 'Settings saved successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleBranchUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/api/settings/update_branch.php', editingBranch);
            setMessage({ type: 'success', text: 'Branch updated successfully' });
            setEditingBranch(null);
            fetchBranches();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update branch' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="flex gap-4 border-b border-gray-800 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-4 px-4 font-medium transition-colors ${activeTab === 'profile' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                    My Profile
                </button>
                {user.role === 'admin' && (
                    <>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`pb-4 px-4 font-medium transition-colors ${activeTab === 'system' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            System Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('branches')}
                            className={`pb-4 px-4 font-medium transition-colors ${activeTab === 'branches' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            Branch Management
                        </button>
                    </>
                )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 min-h-[400px]">
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.type === 'success' ? <Save size={20} /> : <Lock size={20} />}
                        {message.text}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Lock size={20} /> Change Password
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                            <input
                                type="password"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={passwordData.current}
                                onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                            <input
                                type="password"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={passwordData.new}
                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={passwordData.confirm}
                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {activeTab === 'system' && (
                    <form onSubmit={handleConfigSave} className="max-w-md space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <SettingsIcon size={20} /> System Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={config.company_name || ''}
                                    onChange={e => setConfig({ ...config, company_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Company TIN</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={config.company_tin || ''}
                                    onChange={e => setConfig({ ...config, company_tin: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Company Address</label>
                            <textarea
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-20"
                                value={config.company_address || ''}
                                onChange={e => setConfig({ ...config, company_address: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={config.tax_rate}
                                    onChange={e => setConfig({ ...config, tax_rate: e.target.value })}
                                    required
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Permit No / MIN</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={config.permit_no || ''}
                                    onChange={e => setConfig({ ...config, permit_no: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Receipt Footer</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={config.receipt_footer || ''}
                                onChange={e => setConfig({ ...config, receipt_footer: e.target.value })}
                                placeholder="This serves as your official receipt..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </form>
                )}

                {activeTab === 'branches' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Building size={20} /> Manage Branches
                            </h2>
                            <button
                                onClick={() => setEditingBranch({ id: 'new', name: '', address: '' })}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                + Add Branch
                            </button>
                        </div>

                        {editingBranch?.id === 'new' && (
                            <div className="bg-gray-900 border border-blue-500/50 p-4 rounded-lg mb-4">
                                <h3 className="font-bold text-white mb-2">New Branch</h3>
                                <div className="space-y-3">
                                    <input
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                        value={editingBranch.name}
                                        onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                                        placeholder="Branch Name"
                                    />
                                    <input
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                                        value={editingBranch.address}
                                        onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })}
                                        placeholder="Address"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    await axios.post('/api/settings/update_branch.php', editingBranch);
                                                    setMessage({ type: 'success', text: 'Branch created successfully' });
                                                    setEditingBranch(null);
                                                    fetchBranches();
                                                } catch (err) {
                                                    setMessage({ type: 'error', text: 'Failed to create branch' });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-medium"
                                        >
                                            Create
                                        </button>
                                        <button onClick={() => setEditingBranch(null)} className="text-gray-400 hover:text-white px-3 py-1.5 rounded text-sm">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {branches.map(branch => (
                                <div key={branch.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                                    {editingBranch?.id === branch.id ? (
                                        <form onSubmit={handleBranchUpdate} className="flex-1 flex gap-4 items-center">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                                    value={editingBranch.name}
                                                    onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                                                    placeholder="Branch Name"
                                                />
                                                <input
                                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                                                    value={editingBranch.address}
                                                    onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })}
                                                    placeholder="Address"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded">Save</button>
                                                <button type="button" onClick={() => setEditingBranch(null)} className="text-gray-400 hover:bg-gray-700 p-2 rounded">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-bold text-white">{branch.name}</h3>
                                                <p className="text-sm text-gray-500">{branch.address}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingBranch(branch)}
                                                    className="text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded transition-colors text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!window.confirm('Are you sure you want to delete this branch?')) return;
                                                        setLoading(true);
                                                        try {
                                                            await axios.delete(`/api/settings/update_branch.php?id=${branch.id}`);
                                                            setMessage({ type: 'success', text: 'Branch deleted successfully' });
                                                            fetchBranches();
                                                        } catch (err) {
                                                            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete branch' });
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                    className="text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded transition-colors text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
