import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Error403 = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1014] text-white">
            <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mb-6">
                    <ShieldAlert size={40} />
                </div>
                <h1 className="text-4xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    You do not have the required permissions to view this page. Please contact your administrator.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};

export default Error403;
