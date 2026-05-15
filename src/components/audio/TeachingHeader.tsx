import { Logo } from '../ui/Logo';
import { Headphones } from 'lucide-react';

export function TeachingHeader() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center">
          <div className="flex items-center space-x-4">
            <Logo className="h-12 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Headphones className="w-6 h-6 mr-2 text-[#00665C]" />
                Replay Audios
              </h1>
              <p className="text-sm text-gray-500">Écoutez les moments forts de la cellule : adoration, louange, prédication, sainte cène et plus encore</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}