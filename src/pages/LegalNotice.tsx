import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LegalNotice() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-[#00665C] hover:text-[#00665C]/80"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mentions Légales</h1>

      <div className="prose prose-sm max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Informations légales</h2>
          <p className="text-gray-700 mb-4">
            L'application Bergerie est éditée et exploitée par le Siège des Églises Vases d'Honneur,
            qui en est le propriétaire.
          </p>
          <p className="text-gray-700 mb-4">
            Éditeur : Siège des Églises Vases d'Honneur<br />
            Adresse : Angré, Cocody, Abidjan, Côte d'Ivoire<br />
            Téléphone : 27 22 41 29 80<br />
            Email : digital@vasesdhonneur.info
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hébergement</h2>
          <p className="text-gray-700 mb-4">
            L'application est hébergée et diffusée par Cloudflare, Inc.<br />
            Adresse : 101 Townsend Street, San Francisco, CA 94107, États-Unis<br />
            Site web : www.cloudflare.com
          </p>
          <p className="text-gray-700">
            La base de données et les fonctions serverless (edge functions) sont fournies et
            hébergées par Supabase, Inc.<br />
            Site web : www.supabase.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Propriété intellectuelle</h2>
          <p className="text-gray-700 mb-4">
            L'application Bergerie ainsi que l'ensemble de ses contenus (code, interfaces, textes,
            logos et éléments graphiques) sont la propriété exclusive du Siège des Églises Vases d'Honneur.
          </p>
          <p className="text-gray-700 mb-4">
            L'ensemble de cette application relève de la législation en vigueur et des conventions
            internationales sur le droit d'auteur et la propriété intellectuelle. Tous les droits de
            reproduction sont réservés, y compris pour les documents téléchargeables et les
            représentations iconographiques et photographiques.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Données personnelles</h2>
          <p className="text-gray-700 mb-4">
            Les informations recueillies dans l'application sont traitées selon les principes du Règlement Général sur la Protection des Données (RGPD). Pour plus d'informations, consultez notre Politique de Confidentialité.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies</h2>
          <p className="text-gray-700 mb-4">
            L'application utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations sur l'utilisation des cookies, consultez notre Politique de Cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Contact</h2>
          <p className="text-gray-700">
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter à l'adresse suivante : digital@vasesdhonneur.info
          </p>
        </section>
      </div>
    </div>
  );
}
