import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { telHref, whatsappHref } from '../../utils/phoneValidation';
import { BUSINESS_PROFILE_LABELS, type BusinessProfileType } from '../../types/businessProfile.types';
import { AcademieService } from '../../services/academie.service';
import type { AcademieStudentProfile } from '../../types/academie.types';
import { useDepartments } from '../../hooks/useDepartments';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import toast from 'react-hot-toast';
import { Phone, MessageCircle, MapPin, Mail, User, BadgeCheck, Pencil, Save, X, Info } from 'lucide-react';

interface SoulHint {
  gender?: 'male' | 'female';
  conversionYear?: number;
  baptismDate?: string;
  departmentName?: string;
  departmentIdFromServant?: string;
  serviceFamilyId?: string;
}

interface StudentProfile {
  fullName: string;
  nickname?: string;
  phone?: string;
  email?: string;
  location?: string;
  photoUrl?: string;
  status?: string;
  businessProfiles: { type: BusinessProfileType }[];
  createdAt?: string;
}

interface StudentProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

const MARITAL_STATUS_OPTIONS = ['Célibataire', 'Marié(e)', 'Fiancé(e)', 'Divorcé(e)', 'Veuf/Veuve'];
const TSHIRT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export function StudentProfileModal({ userId, onClose }: StudentProfileModalProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [academieProfile, setAcademieProfile] = useState<AcademieStudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [soulHint, setSoulHint] = useState<SoulHint | null>(null);
  const [prefillNote, setPrefillNote] = useState(false);
  const prefillAppliedRef = useRef(false);
  const { departments } = useDepartments();
  const { families } = useServiceFamilies();

  const [form, setForm] = useState({
    birthDate: '', gender: '' as '' | 'male' | 'female', maritalStatus: '', tshirtSize: '',
    conversionYear: '', baptismDate: '', holySpiritBaptized: '' as '' | 'yes' | 'no',
    departmentId: '', serviceFamilyId: '',
  });

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data }, academie] = await Promise.all([
      supabase.from('users')
        .select('full_name, nickname, phone, email, location, photo_url, status, business_profiles, created_at')
        .eq('church_id', getChurchId()).eq('id', userId).single(),
      AcademieService.getStudentProfile(userId),
    ]);
    if (data) {
      setProfile({
        fullName: data.full_name || '—', nickname: data.nickname || undefined, phone: data.phone || undefined,
        email: data.email || undefined, location: data.location || undefined, photoUrl: data.photo_url || undefined,
        status: data.status || undefined, businessProfiles: data.business_profiles || [], createdAt: data.created_at || undefined,
      });
    }
    setAcademieProfile(academie);
    setForm({
      birthDate: academie?.birthDate || '',
      gender: academie?.gender || '',
      maritalStatus: academie?.maritalStatus || '',
      tshirtSize: academie?.tshirtSize || '',
      conversionYear: academie?.conversionYear ? String(academie.conversionYear) : '',
      baptismDate: academie?.baptismDate || '',
      holySpiritBaptized: academie?.holySpiritBaptized === true ? 'yes' : academie?.holySpiritBaptized === false ? 'no' : '',
      departmentId: academie?.departmentId || '',
      serviceFamilyId: academie?.serviceFamilyId || '',
    });

    // Pas encore de fiche Académie confirmée : on tente de retrouver un dossier
    // existant (âme / B.O.S.S) par numéro de téléphone, pour suggérer un
    // pré-remplissage — jamais pour l'imposer, le responsable valide ensuite.
    if (!academie && data?.phone) {
      const phone = data.phone;
      const [{ data: soulRows }, { data: servantRows }] = await Promise.all([
        supabase.from('souls').select('gender, spiritual_profile, service_family_id')
          .eq('church_id', getChurchId()).eq('phone', phone).limit(1),
        supabase.from('servants').select('gender, department_ids')
          .eq('church_id', getChurchId()).eq('phone', phone).limit(1),
      ]);
      const soul = soulRows?.[0] as any;
      const servant = servantRows?.[0] as any;
      if (soul || servant) {
        const sp = soul?.spiritual_profile || {};
        const deptHistory: { name: string; startDate: string }[] = Array.isArray(sp.departments) ? sp.departments : [];
        setSoulHint({
          gender: servant?.gender || soul?.gender || undefined,
          conversionYear: sp.bornAgainDate ? new Date(sp.bornAgainDate).getFullYear() : undefined,
          baptismDate: sp.isBaptized && sp.baptismDate ? String(sp.baptismDate).slice(0, 10) : undefined,
          departmentName: deptHistory.length > 0 ? deptHistory[deptHistory.length - 1].name : undefined,
          departmentIdFromServant: servant?.department_ids?.[0] || undefined,
          serviceFamilyId: soul?.service_family_id || undefined,
        });
      } else {
        setSoulHint(null);
      }
    } else {
      setSoulHint(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) { setProfile(null); setAcademieProfile(null); setEditing(false); setSoulHint(null); setPrefillNote(false); prefillAppliedRef.current = false; return; }
    prefillAppliedRef.current = false;
    setPrefillNote(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Applique le pré-remplissage une fois le dossier existant trouvé et la
  // liste des départements chargée (nécessaire pour matcher un nom de
  // département à son id) — ne touche que les champs encore vides.
  useEffect(() => {
    if (!soulHint || prefillAppliedRef.current) return;
    if (soulHint.departmentName && !soulHint.departmentIdFromServant && departments.length === 0) return;
    prefillAppliedRef.current = true;
    const matchedDeptId = soulHint.departmentIdFromServant
      || departments.find(d => d.name.trim().toLowerCase() === soulHint.departmentName?.trim().toLowerCase())?.id;
    const hasHint = !!(soulHint.gender || soulHint.conversionYear || soulHint.baptismDate || matchedDeptId || soulHint.serviceFamilyId);
    if (!hasHint) return;
    setForm(f => ({
      ...f,
      gender: f.gender || soulHint.gender || f.gender,
      conversionYear: f.conversionYear || (soulHint.conversionYear ? String(soulHint.conversionYear) : f.conversionYear),
      baptismDate: f.baptismDate || soulHint.baptismDate || f.baptismDate,
      departmentId: f.departmentId || matchedDeptId || f.departmentId,
      serviceFamilyId: f.serviceFamilyId || soulHint.serviceFamilyId || f.serviceFamilyId,
    }));
    setPrefillNote(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soulHint, departments]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const updated = await AcademieService.saveStudentProfile(userId, {
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        tshirtSize: form.tshirtSize || undefined,
        conversionYear: form.conversionYear ? parseInt(form.conversionYear, 10) : undefined,
        baptismDate: form.baptismDate || undefined,
        holySpiritBaptized: form.holySpiritBaptized === '' ? undefined : form.holySpiritBaptized === 'yes',
        departmentId: form.departmentId || undefined,
        serviceFamilyId: form.serviceFamilyId || undefined,
      });
      setAcademieProfile(updated);
      toast.success(academieProfile?.matricule ? 'Fiche mise à jour' : `Fiche créée — matricule ${updated.matricule}`);
      setEditing(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const departmentName = departments.find(d => d.id === academieProfile?.departmentId)?.name;
  const familyName = families.find(f => f.id === academieProfile?.serviceFamilyId)?.name;

  return (
    <Modal isOpen={!!userId} onClose={onClose} title="Fiche étudiant Académie">
      <div className="p-6 space-y-4">
        {loading || !profile ? (
          <p className="text-sm text-gray-500 text-center py-6">Chargement...</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-brand-700" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">
                  {profile.fullName}
                  {profile.nickname && <span className="text-gray-500 font-normal"> ({profile.nickname})</span>}
                </p>
                {profile.status && (
                  <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${profile.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {profile.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                <BadgeCheck className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-mono font-semibold text-amber-800">{academieProfile?.matricule || 'Non généré'}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{profile.phone}</span>
                  <div className="flex-1" />
                  {telHref(profile.phone) && <a href={telHref(profile.phone)!} className="p-1.5 rounded-md text-brand-700 hover:bg-brand-50" title="Appeler"><Phone className="w-3.5 h-3.5" /></a>}
                  {whatsappHref(profile.phone) && <a href={whatsappHref(profile.phone)!} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-[#25D366] hover:bg-[#25D366]/10" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>}
                </div>
              )}
              {profile.email && <div className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /> {profile.email}</div>}
              {profile.location && <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {profile.location}</div>}
            </div>

            {profile.businessProfiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Profil(s) dans l'église</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.businessProfiles.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{BUSINESS_PROFILE_LABELS[p.type] || p.type}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Fiche Académie</p>
                {!editing && (
                  <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-brand-700 hover:underline">
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Field label="Date de naissance" value={academieProfile?.birthDate ? new Date(academieProfile.birthDate).toLocaleDateString('fr-FR') : undefined} />
                  <Field label="Genre" value={academieProfile?.gender === 'male' ? 'Homme' : academieProfile?.gender === 'female' ? 'Femme' : undefined} />
                  <Field label="Situation matrimoniale" value={academieProfile?.maritalStatus} />
                  <Field label="Taille de T-shirt" value={academieProfile?.tshirtSize} />
                  <Field label="Année de conversion" value={academieProfile?.conversionYear ? String(academieProfile.conversionYear) : undefined} />
                  <Field label="Baptême par immersion" value={academieProfile?.baptismDate ? new Date(academieProfile.baptismDate).toLocaleDateString('fr-FR') : undefined} />
                  <Field label="Baptisé du Saint-Esprit" value={academieProfile?.holySpiritBaptized === true ? 'Oui' : academieProfile?.holySpiritBaptized === false ? 'Non' : undefined} />
                  <Field label="Département de service" value={departmentName} />
                  <Field label="Famille de service" value={familyName} />
                </div>
              ) : (
                <div className="space-y-3">
                  {prefillNote && (
                    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Certains champs ci-dessous ont été repris automatiquement du dossier existant (âme / B.O.S.S) retrouvé via son numéro de téléphone — vérifie-les avant d'enregistrer.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date de naissance</label>
                      <input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Genre</label>
                      <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value as any }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Situation matrimoniale</label>
                      <select value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        {MARITAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Taille de T-shirt</label>
                      <select value={form.tshirtSize} onChange={e => setForm(p => ({ ...p, tshirtSize: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        {TSHIRT_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Année de conversion</label>
                      <input type="number" min={1900} max={2100} value={form.conversionYear} onChange={e => setForm(p => ({ ...p, conversionYear: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Baptême par immersion</label>
                      <input type="date" value={form.baptismDate} onChange={e => setForm(p => ({ ...p, baptismDate: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Baptisé du Saint-Esprit</label>
                      <select value={form.holySpiritBaptized} onChange={e => setForm(p => ({ ...p, holySpiritBaptized: e.target.value as any }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Département de service</label>
                      <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Famille de service</label>
                      <select value={form.serviceFamilyId} onChange={e => setForm(p => ({ ...p, serviceFamilyId: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">—</option>
                        {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={saving} onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800 disabled:opacity-50">
                      <Save className="w-4 h-4" /> Enregistrer
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                      <X className="w-4 h-4" /> Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {profile.createdAt && (
              <p className="text-xs text-gray-400">Membre depuis le {new Date(profile.createdAt).toLocaleDateString('fr-FR')}</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800">{value || <span className="text-gray-300 italic">Non renseigné</span>}</p>
    </div>
  );
}
