import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkYoutubeState, clearYoutubeState, exchangeYoutubeCodeOnce, youtubeRedirectUri } from '../services/youtubeStats.service';

/** Retour de Google après « Relier la chaîne YouTube » : enregistre l'autorisation puis renvoie vers les statistiques. */
export default function YoutubeCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get('code');
    if (params.get('error')) {
      setError(params.get('error') === 'access_denied' ? "L'autorisation a été refusée sur la page Google." : `Google a renvoyé une erreur : ${params.get('error')}`);
      return;
    }
    if (!code || !checkYoutubeState(params.get('state'))) {
      setError('Ce lien de retour Google est invalide ou a déjà servi. Recommencez depuis la page Statistiques.');
      return;
    }
    let active = true;
    exchangeYoutubeCodeOnce(code, youtubeRedirectUri())
      .then((status) => {
        if (!active) return;
        clearYoutubeState();
        toast.success(`Chaîne « ${status.channelTitle} » reliée`);
        navigate('/statistiques?tab=directs', { replace: true });
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [params, navigate]);

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
      <Youtube className="w-10 h-10 text-red-600 mx-auto" />
      {error ? (
        <>
          <p className="text-sm text-red-700" data-testid="yt-callback-error">{error}</p>
          <Link to="/statistiques?tab=directs" className="inline-block text-sm font-medium text-[#00665C] underline">
            Retour aux statistiques
          </Link>
        </>
      ) : (
        <p className="text-sm text-gray-700">Liaison de la chaîne YouTube et récupération des statistiques… (jusqu'à une minute)</p>
      )}
    </div>
  );
}
