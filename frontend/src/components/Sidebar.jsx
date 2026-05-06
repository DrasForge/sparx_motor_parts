import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Activity, Settings, LogOut, ArrowLeftRight, User, ShieldCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
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
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <div className={`bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
                {/* Branding Section */}
                <div className="p-4 pt-10 relative">
                    {/* Close button for mobile */}
                    <button 
                        onClick={onClose}
                        className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    {/* Collapse toggle for desktop */}
                    <button 
                        onClick={onToggleCollapse}
                        className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-sparx-yellow rounded-full items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    <div className="flex flex-col items-center gap-4 px-2">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-sparx-yellow via-sparx-pink to-sparx-blue rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <img 
                                src="/logo.png" 
                                alt="Logo" 
                                className={`relative object-contain transition-all duration-300 ${isCollapsed ? 'w-8' : 'w-32'}`}
                            />
                        </div>
                        
                        {!isCollapsed && user?.branch_name && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sparx-blue/10 border border-sparx-blue/30 rounded-xl animate-in fade-in zoom-in duration-300">
                                <Activity size={12} className="text-sparx-blue animate-pulse" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.branch_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && <div className="px-4 mb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Main Menu</div>}
                    {menuItems.map((item) => (
                        (item.roles.includes(user?.role) || item.roles.includes('all')) && (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                title={isCollapsed ? item.label : ''}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${isActive(item.path)
                                    ? 'bg-gradient-to-r from-sparx-yellow/10 to-transparent text-white'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {/* Active Indicator Line */}
                                {isActive(item.path) && (
                                    <div className="absolute left-0 w-1 h-6 bg-sparx-yellow rounded-r-full shadow-[0_0_10px_rgba(212,225,43,0.8)]" />
                                )}

                                <div className={`p-2 rounded-lg transition-all duration-300 ${isActive(item.path) ? 'bg-sparx-yellow/20 text-sparx-yellow' : 'text-gray-500 group-hover:text-sparx-yellow group-hover:bg-sparx-yellow/10'}`}>
                                    <item.icon size={20} />
                                </div>
                                {!isCollapsed && (
                                    <span className={`text-sm font-semibold tracking-wide transition-all ${isActive(item.path) ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                        {item.label}
                                    </span>
                                )}

                                {!isCollapsed && isActive(item.path) && (
                                    <div className="ml-auto w-1 h-1 rounded-full bg-sparx-pink animate-pulse" />
                                )}
                            </Link>
                        )
                    ))}
                </nav>

                {/* User Profile Section */}
                <div className="p-3 mt-auto">
                    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/5 rounded-2xl p-3 shadow-2xl overflow-hidden">
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-4'}`}>
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg relative group">
                                <User className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                                {user?.role === 'admin' && (
                                    <div className="absolute bottom-0 right-0 p-0.5 bg-sparx-pink rounded-tl-lg shadow-[0_0_10px_rgba(255,0,160,0.5)]">
                                        <ShieldCheck size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-bold text-white truncate">{user?.username || 'Guest'}</h3>
                                    <span className="text-[9px] font-black uppercase text-sparx-yellow/70">{user?.role?.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={logout}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300 font-bold text-xs group"
                            >
                                <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
                                <span>Sign Out</span>
                            </button>
                        )}
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
        </>
    );
};

export default Sidebar;
