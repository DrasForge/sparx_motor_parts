import { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, Banknote } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, total, onConfirm }) => {
    const [method, setMethod] = useState('cash');
    const [amount, setAmount] = useState('');
    const [refNo, setRefNo] = useState('');
    const [change, setChange] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setRefNo('');
            setChange(0);
            setMethod('cash');
        }
    }, [isOpen]);

    useEffect(() => {
        if (method === 'cash' && amount) {
            const val = parseFloat(amount) - total;
            setChange(val > 0 ? val : 0);
        } else {
            setChange(0);
        }
    }, [amount, total, method]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (method === 'cash' && parseFloat(amount) < total) {
            return; 
        }
        if (method === 'gcash' && !refNo) {
            return;
        }

        onConfirm({
            method,
            amount_tendered: method === 'cash' ? parseFloat(amount) : total,
            reference_no: refNo
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden">
                <div className="bg-gray-900 p-6 text-center border-b border-gray-700">
                    <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Amount</h2>
                    <div className="text-4xl font-bold text-white">₱ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="p-6">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMethod('cash')}
                            className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${method === 'cash' ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <Banknote size={24} />
                            <span className="text-sm font-bold">Cash</span>
                        </button>
                        <button
                            onClick={() => setMethod('gcash')}
                            className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${method === 'gcash' ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <CreditCard size={24} />
                            <span className="text-sm font-bold">GCash</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {method === 'cash' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Amount Tendered</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full text-2xl font-bold p-3 bg-gray-900 border border-gray-600 rounded-xl text-white text-center focus:border-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                                {change > 0 && (
                                    <div className="text-center text-emerald-400 font-medium">
                                        Change: ₱ {change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Reference Number</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-xl text-white outline-none"
                                    placeholder="Enter Ref No."
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={(method === 'cash' && parseFloat(amount) < total) || (method === 'gcash' && !refNo)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <CheckCircle size={20} />
                            Confirm Payment
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-400 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
