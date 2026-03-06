import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader, Shield, Briefcase, Calculator } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        setIsLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    const roles = [
        { id: 'admin', label: 'Admin', icon: Shield, color: 'from-blue-600 to-blue-400' },
        { id: 'inventory_manager', label: 'Manager', icon: Briefcase, color: 'from-emerald-600 to-emerald-400' },
        { id: 'cashier', label: 'Cashier', icon: Calculator, color: 'from-purple-600 to-purple-400' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050510] relative overflow-hidden font-sans">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '8s' }} />

            <div className="w-full max-w-lg p-6 relative z-10">
                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    {/* Glossy Top Shine */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6 transform hover:rotate-6 transition-transform duration-500">
                            <Calculator className="text-white" size={32} />
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent">
                            SPARX GPOS
                        </h1>
                        <p className="text-gray-500 mt-2 text-xs font-bold uppercase tracking-[0.3em]">Next-Gen POS Ecosystem</p>
                    </div>

                    {/* Premium Role Selector */}
                    <div className="grid grid-cols-3 gap-3 p-1.5 bg-black/40 rounded-2xl mb-10 border border-white/5 relative">
                        {roles.map((r) => {
                            const Icon = r.icon;
                            const isSelected = role === r.id;
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`relative z-10 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-500 ${isSelected ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${r.color} opacity-20 blur-sm rounded-xl transition-all duration-500`} />
                                    )}
                                    {isSelected && (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${r.color} rounded-xl shadow-lg transition-all duration-500`} />
                                    )}
                                    <Icon size={18} className="relative z-10" />
                                    <span className="text-[10px] font-black uppercase tracking-wider relative z-10">{r.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5 px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identity</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-all duration-300">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white placeholder-gray-600 transition-all duration-300 font-medium text-lg shadow-inner"
                                    placeholder={`${roles.find(r => r.id === role)?.label} Username`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Access Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-all duration-300">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white placeholder-gray-600 transition-all duration-300 font-medium text-lg shadow-inner tracking-widest"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="button" className="text-[10px] text-blue-400/70 hover:text-blue-400 font-black uppercase tracking-wider transition-colors">Recover Access</button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl text-center border-dashed animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 bg-[length:200%_auto] animate-shimmer" />
                            <div className="relative py-4 px-4 bg-blue-600 hover:bg-transparent transition-colors duration-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] group-hover:shadow-[0_15px_40px_rgba(37,99,235,0.5)] transition-all">
                                {isLoading ? (
                                    <Loader className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Authorize Session
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                            Authorized Access Only • {new Date().getFullYear()} Sparx Tech
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    to { background-position: 200% center; }
                }
                .animate-shimmer {
                    animation: shimmer 3s linear infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}} />
        </div>
    );
};

export default Login;
