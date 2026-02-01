import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Download } from 'lucide-react';

const BarcodeViewer = ({ isOpen, onClose, sku, name }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (isOpen && sku && canvasRef.current) {
            JsBarcode(canvasRef.current, sku, {
                format: "CODE128",
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 16,
                background: "#ffffff",
                lineColor: "#000000",
                margin: 10
            });
        }
    }, [isOpen, sku]);

    if (!isOpen) return null;

    const downloadBarcode = () => {
        const link = document.createElement('a');
        link.download = `${sku}-barcode.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl animate-fadeIn">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white">Product Barcode</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-4 bg-white m-4 rounded-lg">
                    <canvas ref={canvasRef} className="max-w-full"></canvas>
                    <p className="text-sm font-semibold text-gray-800 text-center">{name}</p>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-center">
                    <button
                        onClick={downloadBarcode}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                    >
                        <Download size={18} />
                        Download PNG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodeViewer;
