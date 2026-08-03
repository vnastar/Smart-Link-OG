import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  destinationUrl: string;
  domain?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  slug,
  destinationUrl,
  domain = typeof window !== 'undefined' ? window.location.origin : ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const fullShortUrl = `${domain.replace(/\/$/, '')}/${slug}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, fullShortUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR code generation error:', error);
      });
    }
  }, [isOpen, fullShortUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_${slug}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <QrIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg text-slate-900">Mã QR Code Rút Gọn</h3>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-center mb-4 shadow-inner">
          <canvas ref={canvasRef} className="rounded" />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-center">
          <div className="text-xs text-slate-500 mb-1 font-medium">Short Link Target:</div>
          <div className="font-mono text-sm text-indigo-600 font-bold truncate select-all">
            {fullShortUrl}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1 flex items-center justify-center gap-1">
            <span>Destination:</span>
            <span className="text-slate-600 max-w-[200px] truncate">{destinationUrl}</span>
            <a href={destinationUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition border border-slate-200"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép' : 'Copy Link'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Tải ảnh QR
          </button>
        </div>
      </div>
    </div>
  );
};
