import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { CulteReportService } from '../services/culteReport.service';
import {
  CulteReportType,
  CulteReportData,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  SonoReportData,
  AcademieReportData,
} from '../types/culteReport.types';

interface DeptInfo {
  id: string;
  name: string;
}

const DEPARTMENT_TO_REPORT_TYPE: Record<string, CulteReportType> = {
  'GESTION DES CULTES': 'worship',
  'AMIS DES NOUVEAUX': 'adn',
  FINANCE: 'finance',
  'SAINTE CENE': 'sainte_cene',
  SONORISATION: 'sono',
  "ACADEMIE D'HONNEUR": 'academie',
};

function normalizeDeptName(name: string): string {
  return name.toUpperCase().trim().replace(/\s+/g, ' ');
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function n(v: string): number {
  const parsed = parseInt(v, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function CulteReportForm() {
  const { user } = useAuth();
  const [department, setDepartment] = useState<DeptInfo | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);
  const [serviceDate, setServiceDate] = useState(todayISO());
  const [meetingTypeName, setMeetingTypeName] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [messageTheme, setMessageTheme] = useState('');
  const [messageSource, setMessageSource] = useState('');
  const [notes, setNotes] = useState('');
  const [needsNotes, setNeedsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [worshipReports, setWorshipReports] = useState<{ id: string; label: string }[]>([]);
  const [selectedWorshipReportId, setSelectedWorshipReportId] = useState('');

  // Champs numériques par type
  const [adultMen, setAdultMen] = useState('0');
  const [adultWomen, setAdultWomen] = useState('0');
  const [childBoys, setChildBoys] = useState('0');
  const [childGirls, setChildGirls] = useState('0');
  const [servedMen, setServedMen] = useState('0');
  const [servedWomen, setServedWomen] = useState('0');
  const [blooms, setBlooms] = useState('0');
  const [conversionMen, setConversionMen] = useState('0');
  const [conversionWomen, setConversionWomen] = useState('0');
  const [newMemberMen, setNewMemberMen] = useState('0');
  const [newMemberWomen, setNewMemberWomen] = useState('0');
  const [newMemberBlooms, setNewMemberBlooms] = useState('0');
  const [newMemberChildren, setNewMemberChildren] = useState('0');

  const [newVisitorMen, setNewVisitorMen] = useState('0');
  const [newVisitorWomen, setNewVisitorWomen] = useState('0');
  const [undecided, setUndecided] = useState('0');
  const [wantsToJoinMen, setWantsToJoinMen] = useState('0');
  const [wantsToJoinWomen, setWantsToJoinWomen] = useState('0');
  const [wantsLifeMen, setWantsLifeMen] = useState('0');
  const [wantsLifeWomen, setWantsLifeWomen] = useState('0');

  const [tithes, setTithes] = useState('0');
  const [regularOfferings, setRegularOfferings] = useState('0');
  const [specialOfferings, setSpecialOfferings] = useState('0');

  const [painsPreparees, setPainsPreparees] = useState('0');
  const [vinsPreparees, setVinsPreparees] = useState('0');
  const [painsDistribuees, setPainsDistribuees] = useState('0');
  const [vinsDistribuees, setVinsDistribuees] = useState('0');

  const [sonoBefore, setSonoBefore] = useState({
    materialCheck: 'OK', soundQualityTest: 'OK', liveStreamingTest: 'OK',
    onlineSoundTest: 'OK', onlineVideoTest: 'OK', photoEquipmentPrep: 'OK',
  });
  const [sonoDuring, setSonoDuring] = useState({
    proclamationLaunch: 'OK', roomSoundQuality: 'SATISFAISANT', liveStreaming: 'OUI',
    onlineSoundQuality: 'BONNE', onlineVideoQuality: 'BONNE', photoshootDuringService: 'OUI',
    technicalProblems: '',
  });
  const [sonoAfter, setSonoAfter] = useState({
    servantsPhotos: 'OUI', photoMasking: 'EFFECTUEE', audioReplayPublication: 'OK',
    audioReplayTime: '', videoReplayPublication: 'OK', fileArchiving: 'OK',
  });
  const [generalObservations, setGeneralObservations] = useState('');

  const [className, setClassName] = useState('');
  const [actualStudents, setActualStudents] = useState('0');
  const [presentStudents, setPresentStudents] = useState('0');
  const [moderator, setModerator] = useState('');
  const [courseOfTheDay, setCourseOfTheDay] = useState('');
  const [spiritualAtmosphere, setSpiritualAtmosphere] = useState('');
  const [classParticipation, setClassParticipation] = useState('');
  const [nextCourse, setNextCourse] = useState('');
  const [nextModerator, setNextModerator] = useState('');
  const [nextMeditation, setNextMeditation] = useState('');
  const [nextExercise, setNextExercise] = useState('');

  const reportType = useMemo<CulteReportType | null>(() => {
    if (!department) return null;
    return DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(department.name)] || null;
  }, [department]);

  useEffect(() => {
    if (!user?.businessProfiles) {
      setLoadingDept(false);
      return;
    }
    const load = async () => {
      const profile = (user.businessProfiles as any[]).find(
        (p) => p.type === 'department_leader' && p.departmentId
      );
      if (!profile?.departmentId) {
        setLoadingDept(false);
        return;
      }
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('church_id', getChurchId())
        .eq('id', profile.departmentId)
        .limit(1);
      if (data && data.length > 0) setDepartment({ id: data[0].id, name: data[0].name });
      setLoadingDept(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!reportType || reportType === 'worship') {
      setWorshipReports([]);
      return;
    }
    CulteReportService.getWorshipReportsForDay(serviceDate).then((reports) => {
      setWorshipReports(
        reports.map((r) => ({
          id: r.id,
          label: `${r.serviceDate} — ${(r.data as WorshipReportData).messageTheme || 'Sans thème'}`,
        }))
      );
    });
  }, [reportType, serviceDate]);

  const resetForm = () => {
    setMessageTheme(''); setMessageSource(''); setNotes(''); setNeedsNotes('');
    setAdultMen('0'); setAdultWomen('0'); setChildBoys('0'); setChildGirls('0');
    setServedMen('0'); setServedWomen('0'); setBlooms('0');
    setConversionMen('0'); setConversionWomen('0');
    setNewMemberMen('0'); setNewMemberWomen('0'); setNewMemberBlooms('0'); setNewMemberChildren('0');
    setNewVisitorMen('0'); setNewVisitorWomen('0'); setUndecided('0');
    setWantsToJoinMen('0'); setWantsToJoinWomen('0'); setWantsLifeMen('0'); setWantsLifeWomen('0');
    setTithes('0'); setRegularOfferings('0'); setSpecialOfferings('0');
    setPainsPreparees('0'); setVinsPreparees('0'); setPainsDistribuees('0'); setVinsDistribuees('0');
    setGeneralObservations('');
    setClassName(''); setActualStudents('0'); setPresentStudents('0'); setModerator('');
    setCourseOfTheDay(''); setSpiritualAtmosphere(''); setClassParticipation('');
    setNextCourse(''); setNextModerator(''); setNextMeditation(''); setNextExercise('');
    setSelectedWorshipReportId('');
  };

  const buildData = (): CulteReportData | null => {
    switch (reportType) {
      case 'worship': {
        const data: WorshipReportData = {
          messageTheme, messageSource, speakerName: speakerName || undefined,
          attendance: {
            adults: { men: n(adultMen), women: n(adultWomen) },
            children: { boys: n(childBoys), girls: n(childGirls) },
            served: { men: n(servedMen), women: n(servedWomen) },
            blooms: n(blooms),
            conversions: { men: n(conversionMen), women: n(conversionWomen) },
          },
          newMembers: {
            men: n(newMemberMen), women: n(newMemberWomen),
            blooms: n(newMemberBlooms), children: n(newMemberChildren),
          },
          totalParticipants:
            n(adultMen) + n(adultWomen) + n(childBoys) + n(childGirls) + n(servedMen) + n(servedWomen),
          totalNewMembers: n(newMemberMen) + n(newMemberWomen) + n(newMemberBlooms) + n(newMemberChildren),
        };
        return data;
      }
      case 'adn': {
        const data: AdnReportData = {
          newVisitors: { men: n(newVisitorMen), women: n(newVisitorWomen) },
          visitorDecisions: {
            undecided: n(undecided),
            wantsToJoin: { men: n(wantsToJoinMen), women: n(wantsToJoinWomen) },
            wantsToGiveLifeToJesus: { men: n(wantsLifeMen), women: n(wantsLifeWomen) },
          },
          totalNewVisitors: n(newVisitorMen) + n(newVisitorWomen),
          totalWantsToJoin: n(wantsToJoinMen) + n(wantsToJoinWomen),
          totalWantsToGiveLifeToJesus: n(wantsLifeMen) + n(wantsLifeWomen),
        };
        return data;
      }
      case 'finance': {
        const data: FinanceReportData = {
          tithes: n(tithes), regularOfferings: n(regularOfferings), specialOfferings: n(specialOfferings),
          totalFinances: n(tithes) + n(regularOfferings) + n(specialOfferings),
        };
        return data;
      }
      case 'sainte_cene': {
        const data: SainteCeneReportData = {
          painsPreparees: n(painsPreparees), vinsPreparees: n(vinsPreparees),
          painsDistribuees: n(painsDistribuees), vinsDistribuees: n(vinsDistribuees),
          painsRestantes: n(painsPreparees) - n(painsDistribuees),
          vinsRestantes: n(vinsPreparees) - n(vinsDistribuees),
        };
        return data;
      }
      case 'sono': {
        const data: SonoReportData = {
          beforeService: sonoBefore as SonoReportData['beforeService'],
          duringService: {
            ...sonoDuring,
            technicalProblems: sonoDuring.technicalProblems || undefined,
          } as SonoReportData['duringService'],
          afterService: {
            ...sonoAfter,
            audioReplayTime: sonoAfter.audioReplayTime || undefined,
          } as SonoReportData['afterService'],
          generalObservations: generalObservations || undefined,
        };
        return data;
      }
      case 'academie': {
        const data: AcademieReportData = {
          className, actualStudents: n(actualStudents), presentStudents: n(presentStudents),
          moderator, courseOfTheDay, spiritualAtmosphere, classParticipation,
          nextCourse, nextModerator, nextMeditation, nextExercise,
        };
        return data;
      }
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !reportType) return;

    if (reportType !== 'worship' && !selectedWorshipReportId) {
      toast.error('Sélectionnez le rapport de culte du jour auquel rattacher ce rapport');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = buildData();
      if (!data) throw new Error('Type de rapport inconnu');

      await CulteReportService.submitReport({
        reportType,
        departmentId: department.id,
        departmentName: department.name,
        worshipReportId: reportType === 'worship' ? null : selectedWorshipReportId,
        serviceDate,
        meetingTypeId: null,
        meetingTypeName: meetingTypeName || null,
        submittedBy: user?.id || null,
        submittedByName: user?.fullName || 'Inconnu',
        data,
        notes: notes || undefined,
        needsNotes: needsNotes || undefined,
      });

      toast.success('Rapport enregistré avec succès');
      resetForm();
    } catch (error: any) {
      console.error('Error submitting culte report:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDept) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Chargement...</div>;
  }

  if (!department || !reportType) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
        Aucun département de responsable n'est associé à votre compte, ou ce département n'a pas
        encore de type de rapport de culte configuré. Contactez un administrateur.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-[#00665C]" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Rapport de culte — {department.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date du culte</label>
            <input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type de réunion</label>
            <input type="text" placeholder="ex: Culte du dimanche" value={meetingTypeName} onChange={(e) => setMeetingTypeName(e.target.value)} className={inputCls} />
          </div>
        </div>

        {reportType !== 'worship' && (
          <div>
            <label className={labelCls}>Rapport de culte du jour (obligatoire)</label>
            <select required value={selectedWorshipReportId} onChange={(e) => setSelectedWorshipReportId(e.target.value)} className={inputCls}>
              <option value="">-- Sélectionner --</option>
              {worshipReports.map((w) => (
                <option key={w.id} value={w.id}>{w.label}</option>
              ))}
            </select>
            {worshipReports.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Aucun rapport de culte trouvé pour cette date — demandez au responsable "Gestion des cultes" de le soumettre d'abord.
              </p>
            )}
          </div>
        )}

        {reportType === 'worship' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Thème du message</label>
                <input type="text" value={messageTheme} onChange={(e) => setMessageTheme(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source / référence du message</label>
                <input type="text" value={messageSource} onChange={(e) => setMessageSource(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Orateur</label>
              <input type="text" value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} className={inputCls} />
            </div>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Présence</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Garçons</label><input type="number" min="0" value={childBoys} onChange={(e) => setChildBoys(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Filles</label><input type="number" min="0" value={childGirls} onChange={(e) => setChildGirls(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Serviteurs H.</label><input type="number" min="0" value={servedMen} onChange={(e) => setServedMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Serviteurs F.</label><input type="number" min="0" value={servedWomen} onChange={(e) => setServedWomen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Bloom</label><input type="number" min="0" value={blooms} onChange={(e) => setBlooms(e.target.value)} className={inputCls} /></div>
              </div>
            </fieldset>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Conversions</legend>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={conversionMen} onChange={(e) => setConversionMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={conversionWomen} onChange={(e) => setConversionWomen(e.target.value)} className={inputCls} /></div>
              </div>
            </fieldset>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Nouveaux membres</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={newMemberMen} onChange={(e) => setNewMemberMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={newMemberWomen} onChange={(e) => setNewMemberWomen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Bloom</label><input type="number" min="0" value={newMemberBlooms} onChange={(e) => setNewMemberBlooms(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Enfants</label><input type="number" min="0" value={newMemberChildren} onChange={(e) => setNewMemberChildren(e.target.value)} className={inputCls} /></div>
              </div>
            </fieldset>
          </>
        )}

        {reportType === 'adn' && (
          <>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Nouveaux visiteurs</legend>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={newVisitorMen} onChange={(e) => setNewVisitorMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={newVisitorWomen} onChange={(e) => setNewVisitorWomen(e.target.value)} className={inputCls} /></div>
              </div>
            </fieldset>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Décisions</legend>
              <div><label className={labelCls}>Indécis</label><input type="number" min="0" value={undecided} onChange={(e) => setUndecided(e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Veut rejoindre — Hommes</label><input type="number" min="0" value={wantsToJoinMen} onChange={(e) => setWantsToJoinMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Veut rejoindre — Femmes</label><input type="number" min="0" value={wantsToJoinWomen} onChange={(e) => setWantsToJoinWomen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Donne sa vie — Hommes</label><input type="number" min="0" value={wantsLifeMen} onChange={(e) => setWantsLifeMen(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Donne sa vie — Femmes</label><input type="number" min="0" value={wantsLifeWomen} onChange={(e) => setWantsLifeWomen(e.target.value)} className={inputCls} /></div>
              </div>
            </fieldset>
          </>
        )}

        {reportType === 'finance' && (
          <fieldset className="border rounded-md p-4 space-y-3">
            <legend className="text-sm font-semibold text-gray-700 px-1">Offrandes</legend>
            <div><label className={labelCls}>Dîmes</label><input type="number" min="0" value={tithes} onChange={(e) => setTithes(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Offrandes régulières</label><input type="number" min="0" value={regularOfferings} onChange={(e) => setRegularOfferings(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Offrandes spéciales</label><input type="number" min="0" value={specialOfferings} onChange={(e) => setSpecialOfferings(e.target.value)} className={inputCls} /></div>
          </fieldset>
        )}

        {reportType === 'sainte_cene' && (
          <fieldset className="border rounded-md p-4 space-y-3">
            <legend className="text-sm font-semibold text-gray-700 px-1">Sainte Cène</legend>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Pains préparés</label><input type="number" min="0" value={painsPreparees} onChange={(e) => setPainsPreparees(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Vins préparés</label><input type="number" min="0" value={vinsPreparees} onChange={(e) => setVinsPreparees(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Pains distribués</label><input type="number" min="0" value={painsDistribuees} onChange={(e) => setPainsDistribuees(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Vins distribués</label><input type="number" min="0" value={vinsDistribuees} onChange={(e) => setVinsDistribuees(e.target.value)} className={inputCls} /></div>
            </div>
          </fieldset>
        )}

        {reportType === 'sono' && (
          <>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Avant le culte</legend>
              {(Object.keys(sonoBefore) as (keyof typeof sonoBefore)[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">{key}</label>
                  <select value={sonoBefore[key]} onChange={(e) => setSonoBefore((s) => ({ ...s, [key]: e.target.value }))} className="px-2 py-1 border border-gray-300 rounded-md text-sm">
                    <option value="OK">OK</option>
                    <option value="NOK">NOK</option>
                  </select>
                </div>
              ))}
            </fieldset>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Pendant le culte</legend>
              <div><label className={labelCls}>Problèmes techniques</label><textarea rows={2} value={sonoDuring.technicalProblems} onChange={(e) => setSonoDuring((s) => ({ ...s, technicalProblems: e.target.value }))} className={inputCls} /></div>
            </fieldset>
            <fieldset className="border rounded-md p-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-700 px-1">Après le culte</legend>
              <div><label className={labelCls}>Heure de publication audio</label><input type="text" value={sonoAfter.audioReplayTime} onChange={(e) => setSonoAfter((s) => ({ ...s, audioReplayTime: e.target.value }))} className={inputCls} /></div>
            </fieldset>
            <div>
              <label className={labelCls}>Observations générales</label>
              <textarea rows={3} value={generalObservations} onChange={(e) => setGeneralObservations(e.target.value)} className={inputCls} />
            </div>
          </>
        )}

        {reportType === 'academie' && (
          <fieldset className="border rounded-md p-4 space-y-3">
            <legend className="text-sm font-semibold text-gray-700 px-1">Classe</legend>
            <div><label className={labelCls}>Nom de la classe</label><input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Étudiants inscrits</label><input type="number" min="0" value={actualStudents} onChange={(e) => setActualStudents(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Étudiants présents</label><input type="number" min="0" value={presentStudents} onChange={(e) => setPresentStudents(e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Modérateur</label><input type="text" value={moderator} onChange={(e) => setModerator(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Cours du jour</label><input type="text" value={courseOfTheDay} onChange={(e) => setCourseOfTheDay(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Ambiance spirituelle</label><input type="text" value={spiritualAtmosphere} onChange={(e) => setSpiritualAtmosphere(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Participation de la classe</label><input type="text" value={classParticipation} onChange={(e) => setClassParticipation(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Prochain cours</label><input type="text" value={nextCourse} onChange={(e) => setNextCourse(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Prochain modérateur</label><input type="text" value={nextModerator} onChange={(e) => setNextModerator(e.target.value)} className={inputCls} /></div>
          </fieldset>
        )}

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Besoins à signaler (un par ligne)</label>
          <textarea rows={3} value={needsNotes} onChange={(e) => setNeedsNotes(e.target.value)} placeholder="ex: Micro HF à remplacer" className={inputCls} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
        </button>
      </form>
    </div>
  );
}
