import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Soul, ShepherdOption } from '../../types/database.types';
import { usePermissions } from '../../hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BatchAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BatchAssignmentModal({ isOpen, onClose, onSuccess }: BatchAssignmentModalProps) {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [unassignedSouls, setUnassignedSouls] = useState<Soul[]>([]);
  const [shepherds, setShepherds] = useState<ShepherdOption[]>([]);
  const [selectedSouls, setSelectedSouls] = useState<string[]>([]);
  const [selectedShepherd, setSelectedShepherd] = useState<string>('');

  const canManageSouls = hasPermission('MANAGE_SOULS');

  // Charger les âmes non assignées
  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'souls'),
      where('status', '==', 'active'),
      where('shepherdId', '==', null)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const soulsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        firstVisitDate: doc.data().firstVisitDate?.toDate(),
        promotionToServantDate: doc.data().promotionToServantDate?.toDate()
      })) as Soul[];
      setUnassignedSouls(soulsData);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Charger les bergers disponibles
  useEffect(() => {
    if (!isOpen) return;

    const q = query(collection(db, 'users'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shepherdData = snapshot.docs
        .map(doc => {
          const data: any = doc.data();
          const profiles: any[] = Array.isArray(data.businessProfiles) ? data.businessProfiles : [];
          const fromRole = data.role === 'shepherd' || data.role === 'intern' || data.role === 'admin';
          const fromProfiles = profiles.some(
            (p: any) => (p?.type === 'shepherd' || p?.type === 'intern') && p?.isActive !== false
          );
          if (!fromRole && !fromProfiles) return null;
          const isIntern =
            data.role === 'intern' ||
            (data.role !== 'shepherd' && data.role !== 'admin' &&
              profiles.some((p: any) => p?.type === 'intern' && p?.isActive !== false));
          const role: string = data.role === 'admin' ? 'admin' : (isIntern ? 'intern' : 'shepherd');
          return {
            id: doc.id,
            fullName: (data.fullName || '') as string,
            role,
          };
        })
        .filter((s): s is { id: string; fullName: string; role: string } => s !== null && !!s.fullName)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)) as ShepherdOption[];
      setShepherds(shepherdData);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleSoulSelection = (soulId: string, checked: boolean) => {
    setSelectedSouls(prev => {
      if (checked) {
        return [...prev, soulId];
      } else {
        return prev.filter(id => id !== soulId);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSouls(unassignedSouls.map(soul => soul.id));
    } else {
      setSelectedSouls([]);
    }
  };

  const handleAssignment = async () => {
    if (!canManageSouls) {
      toast.error('Vous n\'avez pas la permission de gérer les âmes');
      return;
    }

    if (selectedSouls.length === 0) {
      toast.error('Veuillez sélectionner au moins une âme');
      return;
    }

    if (!selectedShepherd) {
      toast.error('Veuillez sélectionner un berger');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const now = new Date();

      selectedSouls.forEach(soulId => {
        batch.update(doc(db, 'souls', soulId), {
          shepherdId: selectedShepherd,
          updatedAt: now
        });
      });

      await batch.commit();

      const shepherdName = shepherds.find(s => s.id === selectedShepherd)?.fullName || 'berger sélectionné';
      toast.success(`${selectedSouls.length} âme(s) assignée(s) à ${shepherdName} avec succès !`);
      
      setSelectedSouls([]);
      setSelectedShepherd('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast.error('Erreur lors de l\'assignation des âmes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSouls([]);
    setSelectedShepherd('');
    onClose();
  };

  if (!canManageSouls) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Accès refusé
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-muted-foreground">
            Vous n'avez pas la permission de gérer les âmes.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignation en lot des âmes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du berger */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Berger destinataire</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="shepherd">Sélectionner un berger</Label>
              <Select value={selectedShepherd} onValueChange={setSelectedShepherd}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un berger..." />
                </SelectTrigger>
                <SelectContent>
                  {shepherds.map((shepherd) => (
                    <SelectItem key={shepherd.id} value={shepherd.id}>
                      {shepherd.fullName} ({shepherd.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Liste des âmes non assignées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Âmes non assignées ({unassignedSouls.length})</span>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedSouls.length === unassignedSouls.length && unassignedSouls.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Tout sélectionner
                  </Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {unassignedSouls.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Toutes les âmes sont déjà assignées</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unassignedSouls.map((soul) => (
                      <div key={soul.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`soul-${soul.id}`}
                          checked={selectedSouls.includes(soul.id)}
                          onCheckedChange={(checked) => handleSoulSelection(soul.id, !!checked)}
                        />
                        <Label htmlFor={`soul-${soul.id}`} className="flex-1 cursor-pointer">
                          <div>
                            <div className="font-medium">{soul.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {soul.location} • {soul.phone}
                              {soul.nickname && ` • ${soul.nickname}`}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedSouls.length} âme(s) sélectionnée(s)
            </div>
            <div className="space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleAssignment}
                disabled={loading || selectedSouls.length === 0 || !selectedShepherd}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? 'Assignation...' : `Assigner ${selectedSouls.length} âme(s)`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}