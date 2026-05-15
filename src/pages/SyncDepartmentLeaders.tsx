import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ServantLeaderSync } from '../utils/migration/servantLeaderSync';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SyncDepartmentLeaders() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<{ synced: number; errors: string[] } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResults(null);
    
    try {
      const syncResults = await ServantLeaderSync.syncAllDepartmentHeads();
      setResults(syncResults);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Synchronisation des responsables de département</CardTitle>
          <CardDescription>
            Cette fonctionnalité synchronise automatiquement les profils métier pour tous les serviteurs
            qui sont responsables de département (isHead = true). Chaque responsable recevra les profils
            "Responsable de Département" et "Berger(e)" pour basculer entre les deux modes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Que fait cette synchronisation ?</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Identifie tous les serviteurs avec le statut de responsable (isHead = true)</li>
              <li>Crée ou met à jour leur profil utilisateur avec deux profils métier</li>
              <li>Ajoute le profil "Berger(e)" (actif par défaut)</li>
              <li>Ajoute le profil "Responsable de Département" (avec le departmentId associé)</li>
              <li>Permet de basculer entre ces profils selon le contexte</li>
            </ul>
          </div>

          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="w-full"
            size="lg"
          >
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Synchronisation en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Lancer la synchronisation
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-3">
              {results.errors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Synchronisation réussie</h4>
                      <p className="text-sm text-green-800">
                        {results.synced} responsable{results.synced > 1 ? 's' : ''} synchronisé{results.synced > 1 ? 's' : ''} avec succès.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900">Synchronisation partielle</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        {results.synced} synchronisé{results.synced > 1 ? 's' : ''}, {results.errors.length} erreur{results.errors.length > 1 ? 's' : ''}.
                      </p>
                      <details className="text-xs text-yellow-700">
                        <summary className="cursor-pointer font-medium">Voir les erreurs</summary>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          {results.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">Note importante :</p>
            <p>
              Cette synchronisation ne supprime pas les données existantes. Elle ajoute simplement
              les profils métier manquants pour permettre une meilleure gestion des rôles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
