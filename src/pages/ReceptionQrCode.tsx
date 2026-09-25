import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionQrCode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const publicLink = `${window.location.origin}/accueil`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Lien copié !');
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr-code-accueil.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#00665C]" />
          QR code d'accueil
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          À poser sur la table de réception le dimanche — les nouveaux venus scannent et
          s'enregistrent eux-mêmes, sans qu'un membre ADN soit connecté.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-100">
          <QRCodeCanvas ref={canvasRef} value={publicLink} size={280} level="H" marginSize={2} />
        </div>

        <div className="w-full max-w-sm text-center space-y-3">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-0.5">Lien encodé</p>
            <p className="text-xs text-gray-600 font-mono break-all">{publicLink}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={downloadPng}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[#00665C] border border-[#00665C] text-sm font-medium rounded-xl hover:bg-[#00665C]/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
        Un seul QR code, valable toutes les semaines — inutile de le réimprimer. La page
        détecte automatiquement le culte en cours (1er ou 2e culte) à partir du programme
        récurrent. Les nouvelles fiches restent « en attente » : un membre ADN doit encore
        les recevoir officiellement (assignation du berger, SMS de bienvenue) depuis l'écran
        habituel.
      </div>
    </div>
  );
}
