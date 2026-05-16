import { useState, useEffect } from 'react';
import { collection, db, doc, onData, query, where, writeBatch } from '../../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Megaphone, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';

interface EvangelistOption {
  id: string;
  fullName: string;
}

interface AssignToEvangelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  soulIds: string[];
  onSuccess?: () => void;
}

export default function AssignToEvangelistModal({
  isOpen,
  onClose,
  soulIds,
  onSuccess,
}: AssignToEvangelistModalProps) {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [evangelists, setEvangelists] = useState<EvangelistOption[]>([]);
  const [selectedEvangelist, setSelectedEvangelist] = useState<string>('');

  const canManage = hasPermission('MANAGE_EVANGELIZED_SOULS');

  useEffect(() => {
    if (!isOpen) return;

    const q = query(collection(db, 'users'), where('status', '==', 'active'))
    const unsubscribe = onData(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => {
          const d: any = doc.data();
          const profiles: any[] = Array.isArray(d.businessProfiles) ? d.businessProfiles : [];
          const fromRole = d.role === 'evangelist';
          const fromProfiles = profiles.some(
            (p: any) => p?.type === 'evangelist' && p?.isActive !== false
          );
          if (!fromRole && !fromProfiles) return null;
          return { id: doc.id, fullName: (d.fullName || '') as string };
        })
        .filter((e): e is EvangelistOption => e !== null && !!e.fullName)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
      setEvangelists(data);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleClose = () => {
    setSelectedEvangelist('');
    onClose();
  };

  const handleAssignment = async () => {
    if (!canManage) {
      toast.error("Vous n'avez pas la permission de gérer les âmes évangélisées");
      return;
    }
    if (!selectedEvangelist) {
      toast.error('Veuillez sélectionner un évangéliste');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const now = new Date();
      soulIds.forEach(id => {
        batch.update(doc(db, 'evangelized_souls', id), {
          evangelistId: selectedEvangelist,
          updatedAt: now,
        });
      });
      await batch.commit();

      const name = evangelists.find(e => e.id === selectedEvangelist)?.fullName || "l'évangéliste";
      toast.success(`${soulIds.length} âme(s) assignée(s) à ${name} avec succès !`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      toast.error("Erreur lors de l'assignation des âmes");
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
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
            Vous n'avez pas la permission de gérer les âmes évangélisées.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#00665C]" />
            Assigner {soulIds.length} âme{soulIds.length > 1 ? 's' : ''} à un évangéliste
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">
            Sélectionnez l'évangéliste auquel vous souhaitez assigner les{' '}
            <span className="font-semibold text-gray-900">{soulIds.length}</span> âme
            {soulIds.length > 1 ? 's' : ''} sélectionnée{soulIds.length > 1 ? 's' : ''}.
          </p>

          <div className="space-y-2">
            <Label htmlFor="evangelist-select">Évangéliste destinataire</Label>
            <Select value={selectedEvangelist} onValueChange={setSelectedEvangelist}>
              <SelectTrigger id="evangelist-select">
                <SelectValue placeholder="Choisir un évangéliste..." />
              </SelectTrigger>
              <SelectContent>
                {evangelists.length === 0 ? (
                  <SelectItem value="__none__" disabled>Aucun évangéliste actif</SelectItem>
                ) : (
                  evangelists.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={handleAssignment}
              disabled={loading || !selectedEvangelist}
              className="bg-[#00665C] hover:bg-[#00665C]/90 text-white"
            >
              {loading
                ? 'Assignation...'
                : `Assigner ${soulIds.length} âme${soulIds.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
