import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSelect from '../components/auth/UserSelect';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';
import { Eye, EyeOff, FileText, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { UserType } from '../types/user.types';

const VERSES = [
  { text: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaume 23:1" },
  { text: "Je suis le bon berger ; le bon berger donne sa vie pour ses brebis.", ref: "Jean 10:11" },
  { text: "Allez, faites de toutes les nations des disciples.", ref: "Matthieu 28:19" },
  { text: "Que votre lumière brille devant les hommes.", ref: "Matthieu 5:16" },
  { text: "C'est par la grâce que vous êtes sauvés, par le moyen de la foi.", ref: "Éphésiens 2:8" },
];

export default function Login() {
  const [password, setPassword] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [userType, setUserType] = useState<UserType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [verseIndex] = useState(() => Math.floor(Math.random() * VERSES.length));

  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Réinitialiser l'erreur dès que l'utilisateur modifie un champ
  const handlePhoneChange = (phone: string, type: UserType) => {
    setSelectedPhone(phone);
    setUserType(type);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await login(selectedPhone, password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch {
      setError('Identifiant ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const verse = VERSES[verseIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
      <div className="flex min-h-screen flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">

        {/* Logo + titre + verset */}
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="flex flex-col items-center">
            <Logo className="h-56 w-auto mb-2" />
            <blockquote className="mt-4 text-center">
              <p className="text-sm italic text-[#00665C]/80">« {verse.text} »</p>
              <cite className="text-xs text-gray-400 not-italic mt-1 block">{verse.ref}</cite>
            </blockquote>
          </div>
        </div>

        {/* Formulaire */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-10 px-6 sm:px-12 shadow-2xl rounded-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Sélecteur utilisateur */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Sélectionner un utilisateur
                </label>
                <UserSelect
                  value={selectedPhone}
                  onChange={handlePhoneChange}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                    placeholder="Saisissez votre mot de passe"
                    className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00665C] focus:border-[#00665C] text-base transition-colors ${
                      error ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-500"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Erreur inline persistante */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bouton */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedPhone || !password || isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-lg text-base font-medium text-white transition-all duration-200 ${
                    !selectedPhone || !password || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] hover:shadow-xl'
                  }`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Connexion en cours…' : 'Se connecter'}
                </button>
              </div>

              {/* Aide */}
              <p className="text-center text-xs text-gray-400">
                Problème de connexion ? Contactez votre administrateur.
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Vases d'Honneur Assemblée Grâce Confondante. Tous droits réservés.</p>
          <button
            onClick={() => setIsChangelogOpen(true)}
            className="mt-1 text-xs text-gray-400 hover:text-[#00665C] transition-colors flex items-center justify-center mx-auto"
          >
            <FileText className="w-3 h-3 mr-1" />
            Version 1.7.79
          </button>
          <div className="mt-2 space-x-4">
            <a href="/legal-notice" className="text-[#00665C] hover:text-[#00665C]/80">
              Mentions légales
            </a>
            <a href="/privacy-policy" className="text-[#00665C] hover:text-[#00665C]/80">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>

      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
}
