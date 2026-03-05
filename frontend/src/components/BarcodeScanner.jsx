import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, CheckCircle2 } from 'lucide-react';

const BarcodeScanner = ({ isOpen, onClose, onScanSuccess }) => {
    const scannerRef = useRef(null);
    const [scannedValue, setScannedValue] = useState('');
    const [hasError, setHasError] = useState(false);
    const cooldownRef = useRef(false);

    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5Qrcode('barcode-scanner-region');
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 260, height: 120 } },
            (decodedText) => {
                if (cooldownRef.current) return;
                cooldownRef.current = true;
                setScannedValue(decodedText);
                onScanSuccess?.(decodedText);
                setTimeout(() => { cooldownRef.current = false; }, 2000);
            },
            () => { }
        ).catch(() => setHasError(true));

        return () => {
            scanner.stop().catch(() => { });
            scannerRef.current = null;
            setScannedValue('');
            setHasError(false);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl animate-fadeIn">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white">Scan Barcode</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-4">
                    {hasError ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                            <ScanLine size={40} className="text-gray-500" />
                            <p className="text-sm text-gray-400">Camera unavailable.</p>
                            <p className="text-xs text-gray-500">Use a USB scanner or manual entry instead.</p>
                        </div>
                    ) : (
                        <div className="bg-black rounded-lg overflow-hidden w-full">
                            <div id="barcode-scanner-region" className="w-full" />
                        </div>
                    )}

                    {scannedValue && (
                        <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 rounded-lg px-4 py-2 w-full">
                            <CheckCircle2 size={16} className="text-green-400" />
                            <p className="text-sm text-white font-mono">{scannedValue}</p>
                        </div>
                    )}

                    {!scannedValue && !hasError && (
                        <p className="text-xs text-gray-500 animate-pulse">
                            Align barcode within the frame to scan
                        </p>
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-center">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                    >
                        <X size={18} />
                        Close Scanner
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
