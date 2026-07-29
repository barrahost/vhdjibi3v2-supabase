import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChurch } from '../contexts/ChurchContext';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';
import { Eye, EyeOff, FileText, Loader2, AlertCircle, Building2, ShieldCheck, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChangelogModal } from '../components/ui/ChangelogModal';

const SUPPORT_PHONE = '+225 07 57 00 02 03';
const SUPPORT_PHONE_HREF = 'tel:+2250757000203';

const VERSES = [
  { text: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaume 23:1" },
  { text: "Je suis le bon berger ; le bon berger donne sa vie pour ses brebis.", ref: "Jean 10:11" },
  { text: "Allez, faites de toutes les nations des disciples.", ref: "Matthieu 28:19" },
  { text: "Que votre lumière brille devant les hommes.", ref: "Matthieu 5:16" },
  { text: "C'est par la grâce que vous êtes sauvés, par le moyen de la foi.", ref: "Éphésiens 2:8" },
];

/** Détecte si on est sur le domaine super admin */
function isSuperAdminDomain(): boolean {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  return parts.length >= 3 && parts[0] === 'bergerie-adm';
}

export default function Login() {
  const [password, setPassword] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [verseIndex] = useState(() => Math.floor(Math.random() * VERSES.length));

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const superAdmin = isSuperAdminDomain();
  const { church } = useChurch();

  useEffect(() => {
    if (user) {
      // Sur le domaine super admin → rediriger vers gestion des églises
      navigate(superAdmin ? '/churches' : '/');
    }
  }, [user, navigate, superAdmin]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPhone(e.target.value);
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
      const loggedUser = await login(selectedPhone, password);
      // Sur le domaine super admin, vérifier que c'est bien un super_admin
      if (superAdmin && loggedUser?.role !== 'super_admin') {
        setError('Accès réservé au super administrateur.');
        setIsLoading(false);
        return;
      }
      toast.success('Connexion réussie');
      navigate(superAdmin ? '/churches' : '/');
    } catch {
      setError('Identifiant ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const verse = VERSES[verseIndex];

  // ============================================================
  // SUPER ADMIN LOGIN PAGE
  // ============================================================
  if (superAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-8 px-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Header super admin */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#00665C]/20 border border-[#00665C]/40 rounded-2xl p-4 mb-4">
              <ShieldCheck className="w-12 h-12 text-[#00665C]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Administration Centrale
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Gestion multi-églises — Accès restreint
            </p>
            <div className="flex items-center gap-2 mt-3 bg-[#00665C]/10 border border-[#00665C]/30 rounded-full px-4 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00665C]" />
              <span className="text-xs text-[#00665C] font-medium">bergerie-adm.evdh.org</span>
            </div>
          </div>

          {/* Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={selectedPhone}
                  onChange={e => { setSelectedPhone(e.target.value); setError(''); }}
                  placeholder="+33 6 00 00 00 00"
                  autoComplete="tel"
                  required
                  className={`appearance-none block w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] text-base transition-colors ${
                    error ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className={`appearance-none block w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] text-base transition-colors ${
                      error ? 'border-red-500 bg-red-900/20' : 'border-gray-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedPhone || !password || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-base font-medium transition-all duration-200 ${
                  !selectedPhone || !password || isLoading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#00665C] hover:bg-[#00665C]/80 text-white shadow-lg shadow-[#00665C]/20'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Connexion...' : 'Accéder au panneau admin'}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            Accès réservé aux super administrateurs autorisés
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // CHURCH LOGIN PAGE (normale)
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
      <div className="flex min-h-screen flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">

        {/* Logo + titre + verset */}
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="flex flex-col items-center gap-0">
            <Logo className="h-36 w-auto" />

            <h1
              className="mt-3 text-3xl font-bold text-[#00665C] tracking-wide text-center"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {church?.shortName || church?.name || 'AGC Bergerie'}
            </h1>

            <div className="flex items-center gap-2 my-2 w-48">
              <div className="flex-1 h-px bg-[#F2B636] opacity-70" />
              <div className="w-2 h-2 rounded-full bg-[#F2B636]" />
              <div className="flex-1 h-px bg-[#F2B636] opacity-70" />
            </div>

            <p
              className="text-[11px] tracking-[3px] text-[#C4A020] uppercase text-center"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {church?.name || 'Assemblée Grâce Confondante'}
            </p>

            <div className="mt-1 self-end mr-6 w-12 h-1 bg-[#A32035] rounded" />

            <blockquote className="mt-5 text-center">
              <p className="text-sm italic text-[#00665C]/80">« {verse.text} »</p>
              <cite className="text-xs text-gray-400 not-italic mt-1 block">{verse.ref}</cite>
            </blockquote>
          </div>
        </div>

        {/* Formulaire */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-10 px-6 sm:px-12 shadow-2xl rounded-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={selectedPhone}
                    onChange={handlePhoneChange}
                    placeholder="07 57 00 02 03"
                    autoComplete="tel"
                    required
                    className={`appearance-none block w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00665C] focus:border-[#00665C] text-base transition-colors ${
                      error ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

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

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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

              <p className="text-center text-xs text-gray-400">
                Problème de connexion ? Contactez l'administrateur au{' '}
                <a href={SUPPORT_PHONE_HREF} className="text-[#00665C] hover:underline">
                  {SUPPORT_PHONE}
                </a>
                .
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {church?.copyrightName || church?.name || "Vases d'Honneur Assemblée Grâce Confondante"}. Tous droits réservés.</p>
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
