import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { telHref, whatsappHref } from '../../utils/phoneValidation';
import { BUSINESS_PROFILE_LABELS, type BusinessProfileType } from '../../types/businessProfile.types';
import { Phone, MessageCircle, MapPin, Mail, User } from 'lucide-react';

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

export function StudentProfileModal({ userId, onClose }: StudentProfileModalProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setProfile(null); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('users')
        .select('full_name, nickname, phone, email, location, photo_url, status, business_profiles, created_at')
        .eq('church_id', getChurchId())
        .eq('id', userId)
        .single();
      if (data) {
        setProfile({
          fullName: data.full_name || '—',
          nickname: data.nickname || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          location: data.location || undefined,
          photoUrl: data.photo_url || undefined,
          status: data.status || undefined,
          businessProfiles: data.business_profiles || [],
          createdAt: data.created_at || undefined,
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  return (
    <Modal isOpen={!!userId} onClose={onClose} title="Profil de l'étudiant">
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
              <div className="min-w-0">
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
            </div>

            <div className="space-y-2 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{profile.phone}</span>
                  <div className="flex-1" />
                  {telHref(profile.phone) && (
                    <a href={telHref(profile.phone)!} className="p-1.5 rounded-md text-brand-700 hover:bg-brand-50" title="Appeler"><Phone className="w-3.5 h-3.5" /></a>
                  )}
                  {whatsappHref(profile.phone) && (
                    <a href={whatsappHref(profile.phone)!} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-[#25D366] hover:bg-[#25D366]/10" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /> {profile.email}
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {profile.location}
                </div>
              )}
            </div>

            {profile.businessProfiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Profil(s) dans l'église</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.businessProfiles.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {BUSINESS_PROFILE_LABELS[p.type] || p.type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.createdAt && (
              <p className="text-xs text-gray-400">Membre depuis le {new Date(profile.createdAt).toLocaleDateString('fr-FR')}</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
