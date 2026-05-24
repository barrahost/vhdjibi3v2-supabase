import { Building2 } from 'lucide-react';

export default function ChurchNotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <Building2 className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Église introuvable</h1>
        <p className="text-gray-600 mb-2">
          L'espace <span className="font-mono font-semibold text-red-600">{slug}.evdh.org</span> n'existe pas ou n'est pas encore activé.
        </p>
        <p className="text-sm text-gray-400">Contactez votre administrateur si vous pensez que c'est une erreur.</p>
      </div>
    </div>
  );
}
