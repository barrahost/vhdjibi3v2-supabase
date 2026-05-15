import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Politique de Confidentialité</h1>

      <div className="prose prose-sm max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            La protection de vos données personnelles est une priorité pour Vases d'Honneur Assemblée Grâce Confondante. Cette politique de confidentialité vous informe de la manière dont nous collectons, utilisons et protégeons vos données personnelles sur le site https://chad3.evdh.org.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Données collectées</h2>
          <p className="text-gray-700 mb-4">
            Nous collectons les données suivantes :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Nom et prénoms</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Lieu d'habitation</li>
            <li>Informations sur votre parcours spirituel</li>
            <li>Données de présence aux cultes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Utilisation des données</h2>
          <p className="text-gray-700 mb-4">
            Vos données sont utilisées pour :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Assurer le suivi pastoral</li>
            <li>Vous informer des activités de la cellule</li>
            <li>Gérer les présences aux cultes</li>
            <li>Améliorer nos services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Base légale</h2>
          <p className="text-gray-700 mb-4">
            Le traitement de vos données est basé sur :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Votre consentement explicite</li>
            <li>L'exécution de notre mission pastorale</li>
            <li>Nos obligations légales</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Durée de conservation</h2>
          <p className="text-gray-700 mb-4">
            Vos données sont conservées tant que vous êtes membre de la cellule ou jusqu'à ce que vous demandiez leur suppression.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Vos droits</h2>
          <p className="text-gray-700 mb-4">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Sécurité</h2>
          <p className="text-gray-700 mb-4">
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès, modification, divulgation ou destruction non autorisés.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact</h2>
          <p className="text-gray-700">
            Pour exercer vos droits ou pour toute question concernant la protection de vos données, contactez notre Délégué à la Protection des Données (DPO) à : dpo@evdh.org
          </p>
        </section>
      </div>
    </div>
  );
}