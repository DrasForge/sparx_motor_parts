import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Activity, Settings, LogOut, ArrowLeftRight, User } from 'lucide-react';
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
        { icon: User, label: 'Users', path: '/users', roles: ['admin'] },
        { icon: Activity, label: 'Reports', path: '/reports', roles: ['admin'] },
        { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
    ];

    return (
        <div className="w-64 bg-[#0f1014] border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    SPARX
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                    (item.roles.includes(user?.role) || item.roles.includes('all')) && (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-500/5'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={isActive(item.path) ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
