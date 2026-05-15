import { useState } from 'react';
import { collection, getDocs, doc, setDoc, writeBatch, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
    { name: 'serviceFamilies', label: 'Familles de service', description: 'Familles de service' },
    { name: 'smsTemplates', label: 'Modèles SMS', description: 'Modèles de messages SMS' },
    { name: 'smsCategories', label: 'Catégories SMS', description: 'Catégories de modèles SMS' },
    { name: 'birthdays', label: 'Anniversaires', description: 'Dates d\'anniversaire' },
    { name: 'announcements', label: 'Annonces', description: 'Annonces système' },
    { name: 'announcementLogs', label: 'Logs d\'annonces', description: 'Historique des modifications d\'annonces' },
    { name: 'audio_categories', label: 'Catégories Audio', description: 'Catégories d\'enseignements audio' },
    { name: 'teachings', label: 'Enseignements', description: 'Enseignements audio' }
  ];

  const handleBackup = async () => {
    try {
      setDownloading(true);
      const backup: Record<string, any> = {};
      const metadata = {
        version: '1.4.1',
        timestamp: new Date().toISOString(),
        collections: collections.map(c => c.name),
        format: 'json',
        source: 'firebase',
        compatibleWith: ['firebase', 'supabase']
      };
      
      backup._metadata = metadata;

      // Sauvegarder chaque collection
      for (const { name } of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, name));
          
          // Traiter les timestamps et autres types spéciaux pour la compatibilité
          backup[name] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Convertir les timestamps en objets compatibles
            const processedData = Object.entries(data).reduce((acc, [key, value]) => {
              // Traiter les timestamps
              if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
                acc[key] = {
                  _type: 'timestamp',
                  value: (value as any).toDate().toISOString()
                };
              } 
              // Traiter les références
              else if (value && typeof value === 'object' && 'path' in value && typeof (value as any).path === 'string') {
                acc[key] = {
                  _type: 'reference',
                  path: (value as any).path
                };
              }
              // Traiter les tableaux de timestamps ou références
              else if (Array.isArray(value)) {
                acc[key] = value.map(item => {
                  if (item && typeof item === 'object' && 'toDate' in item && typeof (item as any).toDate === 'function') {
                    return {
                      _type: 'timestamp',
                      value: (item as any).toDate().toISOString()
                    };
                  } else if (item && typeof item === 'object' && 'path' in item && typeof (item as any).path === 'string') {
                    return {
                      _type: 'reference',
                      path: (item as any).path
                    };
                  }
                  return item;
                });
              }
              else {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, any>);
            
            return {
              id: doc.id,
              ...processedData
            };
          });
          
          console.log(`Sauvegarde de ${querySnapshot.size} documents dans la collection ${name}`);
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
        
        // Vérifier la compatibilité
        if (backup._metadata.compatibleWith && 
            !backup._metadata.compatibleWith.includes('firebase')) {
          console.warn(`Cette sauvegarde est marquée comme compatible avec: ${backup._metadata.compatibleWith.join(', ')}`);
        }
      }

      const batch = writeBatch(db);
      let operationCount = 0;
      const BATCH_LIMIT = 500;

      // Fonction pour traiter un lot de documents
      const processBatch = async () => {
        await batch.commit();
        operationCount = 0;
        return writeBatch(db);
      };

      // Pour chaque collection
      for (const { name } of collections) {
        if (!backup[name] || !Array.isArray(backup[name])) {
          console.warn(`Collection ${name} manquante ou invalide`);
          continue;
        }

        // Supprimer les documents existants
        const existingDocs = await getDocs(collection(db, name));
        for (const doc of existingDocs.docs) {
          // Ne pas supprimer le super admin
          if (name === 'admins' && doc.data().role === 'super_admin') {
            console.log('Préservation du super admin');
          } else {
            batch.delete(doc.ref);
            operationCount++;
            
            if (operationCount >= BATCH_LIMIT) {
              await processBatch();
            }
          }
        }

        // Restaurer les documents de la sauvegarde
        for (const item of backup[name]) {
          const { id, ...data } = item;
          const docRef = doc(db, name, id);

          // Traiter les types spéciaux (timestamps, références, etc.)
          const processedData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value && typeof value === 'object' && '_type' in value && (value as any)._type === 'timestamp') {
              acc[key] = new Date((value as any).value);
            } else if (value && typeof value === 'object' && '_type' in value && (value as any)._type === 'reference') {
              // Gérer les références si nécessaire
              acc[key] = doc(db, (value as any).path);
            } else if (value && typeof value === 'object' && 'seconds' in value) {
              // Format de timestamp Firestore
              acc[key] = new Date((value as any).seconds * 1000);
            } else if (Array.isArray(value)) {
              // Traiter les tableaux
              acc[key] = value.map(item => {
                if (item && typeof item === 'object' && '_type' in item && (item as any)._type === 'timestamp') {
                  return new Date((item as any).value);
                } else if (item && typeof item === 'object' && '_type' in item && (item as any)._type === 'reference') {
                  return doc(db, (item as any).path);
                } else if (item && typeof item === 'object' && 'seconds' in item) {
                  return new Date((item as any).seconds * 1000);
                }
                return item;
              });
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, any>);

          batch.set(docRef, processedData);
          operationCount++;
          
          if (operationCount >= BATCH_LIMIT) {
            await processBatch();
          }
        }
      }

      // Commit final si nécessaire
      if (operationCount > 0) {
        await batch.commit();
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
          <h3 className="text-base font-medium text-gray-900">Sauvegarder les données pour migration</h3>
          <p className="text-gray-600">
            Téléchargez une copie complète de la base de données au format JSON compatible avec Supabase.
            Cette sauvegarde contient toutes les données de l'application et peut être utilisée pour migrer vers Supabase :
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
            {downloading ? 'Téléchargement...' : 'Télécharger la sauvegarde compatible Supabase'}
          </button>
        </div>

        {/* Section Restauration */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Restaurer les données</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-sm text-amber-800 font-medium">⚠️ Attention - Migration de données</p>
            <p className="mt-1 text-sm text-amber-700">
              La restauration remplacera toutes les données actuelles par celles de la sauvegarde. 
              Cette action est irréversible et peut être utilisée pour migrer des données depuis Supabase vers Firebase.
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
              {restoring ? 'Restauration...' : 'Restaurer une sauvegarde / Migrer depuis Supabase'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}