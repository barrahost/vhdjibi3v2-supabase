import { supabase } from '../../lib/supabase';
import { useState } from 'react';
import { Download, Upload, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BackupRestore() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Liste des collections à sauvegarder/restaurer
  const collections = [
    { name: 'users', label: 'Utilisateurs', description: 'Comptes utilisateurs (bergers, ADN, etc.)' },
    { name: 'admins', label: 'Administrateurs', description: 'Comptes administrateurs' },
    { name: 'souls', label: 'Âmes', description: 'Informations sur les âmes' },
    { name: 'interactions', label: 'Interactions', description: 'Historique des interactions avec les âmes' },
    { name: 'attendances', label: 'Présences', description: 'Enregistrements des présences aux cultes' },
    { name: 'departments', label: 'Départements', description: 'Départements de service' },
    { name: 'service_families', label: 'Familles de service', description: 'Familles de service' },
    { name: 'sms_templates', label: 'Modèles SMS', description: 'Modèles de messages SMS' },
    { name: 'sms_categories', label: 'Catégories SMS', description: 'Catégories de modèles SMS' },
    { name: 'birthdays', label: 'Anniversaires', description: 'Dates d\'anniversaire' },
    { name: 'announcements', label: 'Annonces', description: 'Annonces système' },
    { name: 'announcement_logs', label: 'Logs d\'annonces', description: 'Historique des modifications d\'annonces' },
    { name: 'audio_categories', label: 'Catégories Audio', description: 'Catégories d\'enseignements audio' },
    { name: 'teachings', label: 'Enseignements', description: 'Enseignements audio' }
  ];

  const handleBackup = async () => {
    try {
      setDownloading(true);
      const backup: Record<string, any> = {};
      const metadata = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        collections: collections.map(c => c.name),
        format: 'json',
        source: 'supabase',
        compatibleWith: ['supabase']
      };

      backup._metadata = metadata;

      // Sauvegarder chaque collection
      for (const { name } of collections) {
        try {
          const { data, error } = await supabase.from(name).select('*');
          if (error) {
            console.error(`Erreur lors de la sauvegarde de la collection ${name}:`, error);
            backup[name] = [];
            backup._errors = backup._errors || [];
            backup._errors.push({ collection: name, error: error.message });
          } else {
            backup[name] = data ?? [];
            console.log(`Sauvegarde de ${(data ?? []).length} documents dans la collection ${name}`);
          }
        } catch (error) {
          console.error(`Erreur lors de la sauvegarde de la collection ${name}:`, error);
          backup[name] = [];
          backup._errors = backup._errors || [];
          backup._errors.push({
            collection: name,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      // Convertir en JSON et créer le fichier
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      link.download = `vhagc-backup-${timestamp}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Sauvegarde téléchargée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    try {
      setRestoring(true);
      const file = event.target.files[0];

      if (!file) {
        throw new Error('Aucun fichier sélectionné');
      }

      const fileContent = await file.text();
      const backup = JSON.parse(fileContent);

      // Vérifier le format du fichier
      if (!backup || typeof backup !== 'object') {
        throw new Error('Format de fichier invalide');
      }

      // Vérifier les métadonnées
      if (!backup._metadata) {
        console.warn('Aucune métadonnée trouvée dans le fichier de sauvegarde');
      } else {
        console.log('Métadonnées de la sauvegarde:', backup._metadata);
      }

      // Pour chaque collection
      for (const { name } of collections) {
        if (!backup[name] || !Array.isArray(backup[name])) {
          console.warn(`Collection ${name} manquante ou invalide`);
          continue;
        }

        // Supprimer les documents existants (sauf super_admin)
        if (name === 'admins') {
          const existingAdmins = await getDocs(supabase)
            .from('admins')
            .select('id, role');
          const toDelete = (existingAdmins ?? [])
            .filter((a: any) => a.role !== 'super_admin')
            .map((a: any) => a.id);
          if (toDelete.length > 0) {
            await supabase.from('admins').delete().in('id', toDelete);
          }
        } else {
          await supabase.from(name).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Restaurer les documents par lots de 100
        const items = backup[name];
        const CHUNK = 100;
        for (let i = 0; i < items.length; i += CHUNK) {
          const chunk = items.slice(i, i + CHUNK);
          const { error } = await supabase.from(name).upsert(chunk, { onConflict: 'id' });
          if (error) {
            console.error(`Erreur restauration ${name} chunk ${i}:`, error);
          }
        }
        console.log(`Restauré ${items.length} entrées dans ${name}`);
      }

      toast.success('Restauration terminée avec succès');

      // Recharger la page pour refléter les changements
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration des données');
    } finally {
      setRestoring(false);
      // Réinitialiser l'input file
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold text-[#00665C] mb-4 flex items-center">
        <Database className="w-5 h-5 mr-2" />
        Sauvegarde et restauration
      </h2>

      <div className="space-y-8">
        {/* Section Sauvegarde */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Sauvegarder les données</h3>
          <p className="text-gray-600">
            Téléchargez une copie complète de la base de données au format JSON.
            Cette sauvegarde contient toutes les données de l'application :
          </p>

          <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-2">
            {collections.map(({ label, description }) => (
              <li key={label}>
                <span className="font-medium">{label}</span>
                {description && <span className="text-gray-500"> - {description}</span>}
              </li>
            ))}
          </ul>

          <button
            onClick={handleBackup}
            disabled={downloading || restoring}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Téléchargement...' : 'Télécharger la sauvegarde'}
          </button>
        </div>

        {/* Section Restauration */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Restaurer les données</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-sm text-amber-800 font-medium">⚠️ Attention</p>
            <p className="mt-1 text-sm text-amber-700">
              La restauration remplacera toutes les données actuelles par celles de la sauvegarde.
              Cette action est irréversible.
              Assurez-vous d'avoir une sauvegarde récente avant de procéder.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={downloading || restoring}
              className="hidden"
              id="restore-file"
            />
            <label
              htmlFor="restore-file"
              className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md cursor-pointer ${
                (downloading || restoring) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              {restoring ? 'Restauration...' : 'Restaurer une sauvegarde'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
