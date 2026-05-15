import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Cake, Home, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BirthdayData {
  fullName: string;
  birthMonth: string;
  birthDay: string;
}

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function BirthdayConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [birthdayData, setBirthdayData] = useState<BirthdayData | null>(null);

  useEffect(() => {
    // Récupérer les données depuis la navigation state
    const data = location.state as BirthdayData | undefined;
    
    if (data) {
      setBirthdayData(data);
      // Nettoyer le state après récupération pour éviter qu'il persiste
      window.history.replaceState({}, document.title);
    } else {
      // Si pas de données, rediriger vers le formulaire
      navigate('/anniversaires/ajouter');
    }
  }, [location, navigate]);

  if (!birthdayData) {
    return null;
  }

  const monthName = monthNames[parseInt(birthdayData.birthMonth) - 1];
  const firstName = birthdayData.fullName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/15 via-[#F2B636]/5 to-[#00665C]/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#F2B636]/40 rounded-full animate-ping" />
            <div className="relative p-4 bg-[#00665C]/20 rounded-full">
              <CheckCircle className="w-16 h-16 text-[#00665C]" />
            </div>
          </div>
        </div>

        {/* Main Confirmation Card */}
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border border-t-4 border-t-[#F2B636]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00665C] to-[#00665C]/80 bg-clip-text text-transparent mb-2">
              Merci {firstName} !
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre anniversaire a été enregistré avec succès
            </p>
          </div>

          {/* Birthday Info Display */}
          <div className="bg-gradient-to-br from-[#00665C]/10 to-[#00665C]/5 rounded-lg p-6 mb-8 border border-[#00665C]/30">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Cake className="w-6 h-6 text-[#00665C]" />
              <h2 className="text-xl font-semibold text-foreground">
                Date enregistrée
              </h2>
            </div>
            <p className="text-center text-2xl font-bold text-[#F2B636]">
              {parseInt(birthdayData.birthDay)} {monthName}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-[#F2B636]/15 to-[#F2B636]/10 rounded-lg p-4 mb-8 border-l-4 border-[#F2B636]">
            <p className="text-sm text-foreground text-center">
              🎉 Nous vous enverrons un message de félicitations le jour de votre anniversaire !
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/anniversaires/ajouter')}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium shadow-sm border-2 border-[#00665C]/20"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un autre
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#00665C] text-white rounded-lg hover:bg-[#00665C]/90 transition-colors font-medium shadow-md"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
