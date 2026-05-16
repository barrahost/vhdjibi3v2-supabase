import { useState, useEffect } from 'react';

import { ShepherdOption } from '../../types/database.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';

interface AssignToShepherdModalProps {
  isOpen: boolean;
  onClose: () => void;
  soulIds: string[];
  onSuccess?: () => void;
}

export default function AssignToShepherdModal({
  isOpen,
  onClose,
  soulIds,
  onSuccess,
}: AssignToShepherdModalProps) {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [shepherds, setShepherds] = useState<ShepherdOption[]>([]);
  const [selectedShepherd, setSelectedShepherd] = useState<string>('');

  const canManageSouls = hasPermission('MANAGE_SOULS');

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('users')
      .select('id, full_name, role')
      .eq('status', 'active')
      .in('role', ['shepherd', 'intern', 'admin'])
      .then(({ data }) => {
        const list = (data ?? [])
          .map((r: any) => ({ id: r.id, fullName: r.full_name || '', role: r.role } as ShepherdOption))
          .filter((s: ShepherdOption) => !!s.fullName)
          .sort((a: ShepherdOption, b: ShepherdOption) => a.fullName.localeCompare(b.fullName));
        setShepherds(list);
      });
  }, [isOpen]);

  const handleClose = () => {
    setSelectedShepherd('');
    onClose();
  };

  const handleAssignment = async () => {
    if (!canManageSouls) {
      toast.error("Vous n'avez pas la permission de gérer les âmes");
      return;
    }
    if (!selectedShepherd) {
      toast.error('Veuillez sélectionner un berger');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('souls')
        .update({ shepherd_id: selectedShepherd, updated_at: now })
        .in('id', soulIds);

      if (error) throw error;

      const shepherdName =
        shepherds.find(s => s.id === selectedShepherd)?.fullName || 'le berger sélectionné';
      toast.success(`${soulIds.length} âme(s) assignée(s) à ${shepherdName} avec succès !`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      toast.error("Erreur lors de l'assignation des âmes");
    } finally {
      setLoading(false);
    }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#00665C]" />
            Assigner {soulIds.length} âme{soulIds.length > 1 ? 's' : ''} à un berger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">
            Sélectionnez le berger auquel vous souhaitez assigner les{' '}
            <span className="font-semibold text-gray-900">{soulIds.length}</span> âme
            {soulIds.length > 1 ? 's' : ''} sélectionnée{soulIds.length > 1 ? 's' : ''}.
          </p>

          <div className="space-y-2">
            <Label htmlFor="shepherd-select">Berger destinataire</Label>
            <Select value={selectedShepherd} onValueChange={setSelectedShepherd}>
              <SelectTrigger id="shepherd-select">
                <SelectValue placeholder="Choisir un berger..." />
              </SelectTrigger>
              <SelectContent>
                {shepherds.map(shepherd => (
                  <SelectItem key={shepherd.id} value={shepherd.id}>
                    {shepherd.fullName}{' '}
                    <span className="text-muted-foreground text-xs">({shepherd.role})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={handleAssignment}
              disabled={loading || !selectedShepherd}
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
