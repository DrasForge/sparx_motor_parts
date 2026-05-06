import { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#18191c] text-white flex flex-col lg:flex-row">
            {/* Mobile Top Bar */}
            <div className="lg:hidden bg-[#0a0a0c] p-4 flex items-center justify-between border-b border-white/5 sticky top-0 z-40 w-full">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-8" />
                    <span className="font-bold tracking-wider">SPARXG</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            
            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
