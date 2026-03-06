import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#18191c] text-white pl-72">
            <Sidebar />
            <main className="p-8 max-w-[1600px] mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
