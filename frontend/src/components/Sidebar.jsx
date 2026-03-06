import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Activity, Settings, LogOut, ArrowLeftRight, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'inventory_manager', 'cashier'] },
        { icon: Package, label: 'Inventory', path: '/inventory', roles: ['admin', 'inventory_manager'] },
        { icon: ArrowLeftRight, label: 'Logistics', path: '/logistics', roles: ['admin', 'inventory_manager'] },
        { icon: ShoppingCart, label: 'POS / Sales', path: '/pos', roles: ['admin', 'cashier'] },
        { icon: ArrowLeftRight, label: 'Returns', path: '/returns', roles: ['admin', 'cashier'] },
        { icon: User, label: 'Users', path: '/users', roles: ['admin'] },
        { icon: Activity, label: 'Reports', path: '/reports', roles: ['admin'] },
        { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
    ];

    return (
        <div className="w-72 bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
            {/* Branding Section */}
            <div className="p-8 pt-10">
                <div className="flex items-center gap-3 group px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-500 transform group-hover:rotate-12">
                        <Package className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-white via-blue-200 to-emerald-300 bg-clip-text text-transparent">
                            SPARX
                        </h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] -mt-1">Motor Parts POS</p>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-4 mb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Main Menu</div>
                {menuItems.map((item) => (
                    (item.roles.includes(user?.role) || item.roles.includes('all')) && (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive(item.path)
                                ? 'bg-gradient-to-r from-blue-600/20 to-emerald-500/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {/* Active Indicator Line */}
                            {isActive(item.path) && (
                                <div className="absolute left-0 w-1.5 h-6 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                            )}

                            <div className={`p-2 rounded-lg transition-all duration-300 ${isActive(item.path) ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-600/10'}`}>
                                <item.icon size={20} />
                            </div>
                            <span className={`text-sm font-semibold tracking-wide transition-all ${isActive(item.path) ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                {item.label}
                            </span>

                            {isActive(item.path) && (
                                <div className="ml-auto w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                            )}
                        </Link>
                    )
                ))}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 mt-auto">
                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/5 rounded-3xl p-4 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg relative group">
                            <User className="text-gray-400 group-hover:text-white transition-colors" size={24} />
                            {user?.role === 'admin' && (
                                <div className="absolute bottom-0 right-0 p-0.5 bg-emerald-500 rounded-tl-lg">
                                    <ShieldCheck size={10} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{user?.username || 'Guest User'}</h3>
                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${user?.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                        user?.role === 'inventory_manager' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                            'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                    }`}>
                                    {user?.role?.replace('_', ' ') || 'Cashier'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300 font-bold text-sm group"
                    >
                        <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}} />
        </div>
    );
};

export default Sidebar;
