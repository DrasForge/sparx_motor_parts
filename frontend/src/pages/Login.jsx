import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader, Shield, Briefcase, Calculator, Smartphone, Cpu } from 'lucide-react';

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
        { id: 'admin', label: 'Admin', icon: Shield, color: 'text-blue-500' },
        { id: 'inventory_manager', label: 'Manager', icon: Briefcase, color: 'text-emerald-500' },
        { id: 'cashier', label: 'Cashier', icon: Calculator, color: 'text-purple-500' }
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#08080a] text-white selection:bg-blue-500/30 font-sans overflow-hidden">

            {/* Left Side: Cinematic Branding (60%) */}
            <div className="hidden md:flex flex-[1.5] relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.15]"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />

                {/* Animated Glowing Orbs */}
                <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[20vw] h-[20vw] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative z-10 w-full max-w-2xl">
                    <div className="space-y-4 animate-reveal">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <Cpu size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/50">System Version 4.0.1_RC</span>
                        </div>

                        <h1 className="text-[120px] leading-[0.8] font-black italic tracking-tighter select-none">
                            <span className="block text-white">SPARX</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-emerald-400 to-transparent opacity-80">GPOS.</span>
                        </h1>

                        <p className="text-xl font-medium text-gray-500 max-w-lg pt-4 leading-relaxed">
                            A high-fidelity <span className="text-white italic">Motor Parts Ecosystem</span>.
                            Engineered for precision, speed, and absolute reliability.
                        </p>
                    </div>

                    <div className="mt-24 grid grid-cols-3 gap-8 opacity-40 hover:opacity-100 transition-opacity duration-700">
                        <div className="space-y-1">
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400">Security</div>
                            <div className="text-lg font-bold">AES-256</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400">Response</div>
                            <div className="text-lg font-bold">&lt; 12ms</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400">Uptime</div>
                            <div className="text-lg font-bold">99.9%</div>
                        </div>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-white/10" />
                <div className="absolute bottom-12 right-12 w-12 h-12 border-b-2 border-r-2 border-white/10" />
            </div>

            {/* Right Side: Minimalist Auth Form (40%) */}
            <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#0a0a0c] relative">
                <div className="w-full max-w-sm space-y-12 animate-slide-up">

                    {/* Compact Logo for Mobile */}
                    <div className="md:hidden text-center mb-12">
                        <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">SPARX.</h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold tracking-tight">Sign In</h2>
                        <p className="text-gray-500 font-medium">Please enter your specialized credentials.</p>
                    </div>

                    {/* Minimalist Role Toggle */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                        {roles.map((r) => {
                            const isSelected = role === r.id;
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isSelected ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="group space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-focus-within:text-blue-400 transition-colors">Access Identifier</label>
                                <div className="relative border-b-2 border-white/10 group-focus-within:border-blue-500 transition-all duration-500">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full py-3 bg-transparent outline-none text-xl font-medium placeholder-gray-800 transition-all"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-focus-within:text-blue-400 transition-colors">Security Key</label>
                                <div className="relative border-b-2 border-white/10 group-focus-within:border-blue-500 transition-all duration-500">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full py-3 bg-transparent outline-none text-xl font-medium placeholder-gray-800 transition-all tracking-widest"
                                        placeholder="Password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs font-bold text-red-500 animate-shake">
                                Error: {error}
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full py-5 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:pr-12 active:scale-95 disabled:opacity-50"
                            >
                                <span className="relative z-10 transition-all">
                                    {isLoading ? 'Verifying...' : 'Authenticate'}
                                </span>
                                {!isLoading && (
                                    <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:right-8 transition-all" size={20} />
                                )}
                            </button>

                            <button type="button" className="text-[10px] text-gray-600 hover:text-white font-black uppercase tracking-widest transition-colors">
                                Forgotten Security Credentials?
                            </button>
                        </div>
                    </form>

                    <div className="pt-12 flex items-center gap-6 text-gray-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest">Global Ops Node #051</p>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes reveal {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-reveal { animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}} />
        </div>
    );
};

export default Login;
