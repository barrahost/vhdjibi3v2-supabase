import { useState, useEffect } from 'react';

import { Soul } from '../../../types/database.types';
import { ServantFormData } from '../../../types/servant.types';
import { SoulPromotionService } from '../../../services/soulPromotion.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { PhoneInput } from '../../ui/PhoneInput';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';

interface ServantPromotionFormProps {
  soul: Soul;
  onSuccess?: () => void;
}

interface Department {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export default function ServantPromotionForm({ soul, onSuccess }: ServantPromotionFormProps) {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<ServantFormData>({
    fullName: soul.fullName,
    nickname: soul.nickname || '',
    gender: soul.gender,
    phone: soul.phone,
    email: '',
    departmentIds: [],
    isHead: false,
    isShepherd: false,
    status: 'active'
  });

  // Vérifier si l'utilisateur peut promouvoir des âmes
  const canPromote = hasPermission('PROMOTE_SOUL_TO_SERVANT');
  const promotionCheck = SoulPromotionService.canBePromoted(soul);

  // Charger les départements disponibles
  useEffect(() => {
    supabase.from('departments').select('*').eq('church_id', getChurchId()).eq('status', 'active').order('order', { ascending: true })
      .then(({ data }: any) => setDepartments((data ?? []) as Department[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canPromote) {
      toast.error('Vous n\'avez pas la permission de promouvoir des âmes');
      return;
    }

    if (!promotionCheck.canPromote) {
      toast.error(promotionCheck.reason || 'Cette âme ne peut pas être promue');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('L\'email est requis pour les serviteurs');
      return;
    }

    if (formData.departmentIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un département');
      return;
    }

    setLoading(true);
    try {
      await SoulPromotionService.promoteToServant(soul.id, formData);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServantFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDepartment = (deptId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter(id => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  };

  if (!canPromote) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Vous n'avez pas la permission de promouvoir des âmes</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!promotionCheck.canPromote) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{promotionCheck.reason}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <UserPlus className="h-5 w-5" />
          Promouvoir au rang de serviteur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="nickname">Surnom</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <PhoneInput
                required
                value={formData.phone}
                onChange={(phone) => handleInputChange('phone', phone)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="email@exemple.com"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Département(s) *</Label>
              <div className="mt-1.5 space-y-2 border rounded-md p-3">
                {departments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun département actif</p>
                )}
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept.id}`}
                      checked={formData.departmentIds.includes(dept.id)}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                    />
                    <Label htmlFor={`dept-${dept.id}`} className="font-normal cursor-pointer">
                      {dept.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHead"
                checked={formData.isHead}
                onCheckedChange={(checked) => handleInputChange('isHead', checked)}
              />
              <Label htmlFor="isHead">Responsable de département</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isShepherd"
                checked={formData.isShepherd}
                onCheckedChange={(checked) => handleInputChange('isShepherd', checked)}
              />
              <Label htmlFor="isShepherd">Également berger</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Promotion en cours...' : 'Promouvoir au rang de serviteur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}