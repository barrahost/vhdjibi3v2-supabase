import { Download } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  CulteReport,
  CULTE_REPORT_TYPE_LABELS,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  SonoReportData,
  AcademieReportData,
} from '../../types/culteReport.types';
import { exportCulteReportPdf } from '../../utils/culteReportPdf';

interface CulteReportPreviewModalProps {
  report: CulteReport;
  isOpen: boolean;
  onClose: () => void;
}

const OK_NOK_LABELS: Record<string, string> = {
  OK: 'OK', NOK: 'NOK', OUI: 'Oui', NON: 'Non',
  SATISFAISANT: 'Satisfaisant', NON_SATISFAISANT: 'Non satisfaisant',
  BONNE: 'Bonne', MOYENNE: 'Moyenne', MAUVAISE: 'Mauvaise',
  EFFECTUEE: 'Effectuée', NON_EFFECTUEE: 'Non effectuée',
  PROBLEME: 'Problème', EN_COURS: 'En cours',
};
const statusLabel = (v?: string) => (v ? OK_NOK_LABELS[v] ?? v : '—');

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function renderBody(report: CulteReport) {
  switch (report.reportType) {
    case 'worship': {
      const d = report.data as WorshipReportData;
      return (
        <>
          <Section title="Informations générales">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
              <Field label="Type de rencontre" value={report.meetingTypeName || '—'} />
              <Field label="Orateur" value={d.speakerName || '—'} />
              <Field label="Soumis par" value={report.submittedByName} />
              <div className="md:col-span-2"><Field label="Thème" value={d.messageTheme || '—'} /></div>
              <div className="md:col-span-2"><Field label="Source biblique" value={d.messageSource || '—'} /></div>
            </div>
          </Section>
          <Section title="Statistiques de présence">
            <div className="mb-4 p-4 bg-[#00665C]/8 rounded-lg">
              <p className="text-[#004d45] font-semibold">Total des participants : {d.totalParticipants || 0}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Adultes</h4>
                <p>Hommes : {d.attendance?.adults?.men || 0}</p>
                <p>Femmes : {d.attendance?.adults?.women || 0}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Enfants</h4>
                <p>Garçons : {d.attendance?.children?.boys || 0}</p>
                <p>Filles : {d.attendance?.children?.girls || 0}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Boss ayant servi</h4>
                <p>Hommes : {d.attendance?.served?.men || 0}</p>
                <p>Femmes : {d.attendance?.served?.women || 0}</p>
                <p>Blooms : {d.attendance?.blooms || 0}</p>
              </div>
            </div>
          </Section>
          <Section title="Appel à conversion">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hommes" value={d.attendance?.conversions?.men || 0} />
              <Field label="Femmes" value={d.attendance?.conversions?.women || 0} />
            </div>
          </Section>
          <Section title="Nouveaux reçus">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Hommes" value={d.newMembers?.men || 0} />
              <Field label="Femmes" value={d.newMembers?.women || 0} />
              <Field label="Blooms" value={d.newMembers?.blooms || 0} />
              <Field label="Enfants" value={d.newMembers?.children || 0} />
            </div>
          </Section>
        </>
      );
    }
    case 'finance': {
      const d = report.data as FinanceReportData;
      return (
        <Section title="Détail des finances">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
            <Field label="Soumis par" value={report.submittedByName} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Dîmes" value={`${(d.tithes || 0).toLocaleString('fr-FR')} FCFA`} />
            <Field label="Offrandes ordinaires" value={`${(d.regularOfferings || 0).toLocaleString('fr-FR')} FCFA`} />
            <Field label="Offrandes spéciales" value={`${(d.specialOfferings || 0).toLocaleString('fr-FR')} FCFA`} />
          </div>
          <div className="mt-4 p-4 bg-[#00665C]/8 rounded-lg">
            <p className="text-[#004d45] font-semibold">Total des entrées : {(d.totalFinances || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </Section>
      );
    }
    case 'adn': {
      const d = report.data as AdnReportData;
      return (
        <>
          <Section title="Visiteurs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
              <Field label="Soumis par" value={report.submittedByName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hommes" value={d.newVisitors?.men || 0} />
              <Field label="Femmes" value={d.newVisitors?.women || 0} />
            </div>
            <div className="mt-4 p-4 bg-[#00665C]/8 rounded-lg">
              <p className="text-[#004d45] font-semibold">Total visiteurs : {d.totalNewVisitors || 0}</p>
            </div>
          </Section>
          <Section title="Décisions">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Veut rejoindre (H)" value={d.visitorDecisions?.wantsToJoin?.men || 0} />
              <Field label="Veut rejoindre (F)" value={d.visitorDecisions?.wantsToJoin?.women || 0} />
              <Field label="Décision pour Christ (H)" value={d.visitorDecisions?.wantsToGiveLifeToJesus?.men || 0} />
              <Field label="Décision pour Christ (F)" value={d.visitorDecisions?.wantsToGiveLifeToJesus?.women || 0} />
              <Field label="Indécis" value={d.visitorDecisions?.undecided || 0} />
            </div>
          </Section>
        </>
      );
    }
    case 'sainte_cene': {
      const d = report.data as SainteCeneReportData;
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
            <Field label="Soumis par" value={report.submittedByName} />
          </div>
          <Section title="Pains">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Préparés" value={d.painsPreparees || 0} />
              <Field label="Distribués" value={d.painsDistribuees || 0} />
              <Field label="Restants" value={d.painsRestantes || 0} />
            </div>
          </Section>
          <Section title="Vins">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Préparés" value={d.vinsPreparees || 0} />
              <Field label="Distribués" value={d.vinsDistribuees || 0} />
              <Field label="Restants" value={d.vinsRestantes || 0} />
            </div>
          </Section>
        </>
      );
    }
    case 'academie': {
      const d = report.data as AcademieReportData;
      const rate = d.actualStudents > 0 ? Math.round((d.presentStudents / d.actualStudents) * 100) : 0;
      return (
        <>
          <Section title="Informations de la session">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
              <Field label="Classe" value={d.className || '—'} />
              <Field label="Modérateur" value={d.moderator || '—'} />
              <Field label="Cours du jour" value={d.courseOfTheDay || '—'} />
              <Field label="Atmosphère spirituelle" value={d.spiritualAtmosphere || '—'} />
              <Field label="Participation" value={d.classParticipation || '—'} />
              <Field label="Soumis par" value={report.submittedByName} />
            </div>
          </Section>
          <Section title="Présence">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Étudiants inscrits" value={d.actualStudents || 0} />
              <Field label="Étudiants présents" value={d.presentStudents || 0} />
              <Field label="Taux de présence" value={`${rate}%`} />
            </div>
          </Section>
          <Section title="Prochaine session">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Cours prévu" value={d.nextCourse || '—'} />
              <Field label="Prochain modérateur" value={d.nextModerator || '—'} />
              <Field label="Méditation" value={d.nextMeditation || '—'} />
              <Field label="Exercice" value={d.nextExercise || '—'} />
            </div>
          </Section>
        </>
      );
    }
    case 'sono': {
      const d = report.data as SonoReportData;
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Date" value={new Date(report.serviceDate).toLocaleDateString('fr-FR')} />
            <Field label="Soumis par" value={report.submittedByName} />
          </div>
          <Section title="Avant le culte">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Vérification matériel" value={statusLabel(d.beforeService?.materialCheck)} />
              <Field label="Test qualité son" value={statusLabel(d.beforeService?.soundQualityTest)} />
              <Field label="Test live streaming" value={statusLabel(d.beforeService?.liveStreamingTest)} />
              <Field label="Test son en ligne" value={statusLabel(d.beforeService?.onlineSoundTest)} />
              <Field label="Test vidéo en ligne" value={statusLabel(d.beforeService?.onlineVideoTest)} />
              <Field label="Préparation équipement photo" value={statusLabel(d.beforeService?.photoEquipmentPrep)} />
            </div>
          </Section>
          <Section title="Pendant le culte">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Lancement proclamation" value={statusLabel(d.duringService?.proclamationLaunch)} />
              <Field label="Qualité son salle" value={statusLabel(d.duringService?.roomSoundQuality)} />
              <Field label="Live streaming" value={statusLabel(d.duringService?.liveStreaming)} />
              <Field label="Qualité son en ligne" value={statusLabel(d.duringService?.onlineSoundQuality)} />
              <Field label="Qualité vidéo en ligne" value={statusLabel(d.duringService?.onlineVideoQuality)} />
              <Field label="Photos pendant culte" value={statusLabel(d.duringService?.photoshootDuringService)} />
            </div>
            {d.duringService?.technicalProblems && (
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                Problèmes techniques : {d.duringService.technicalProblems}
              </p>
            )}
          </Section>
          <Section title="Après le culte">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Photos servants" value={statusLabel(d.afterService?.servantsPhotos)} />
              <Field label="Masquage photos" value={statusLabel(d.afterService?.photoMasking)} />
              <Field label="Publication replay audio" value={statusLabel(d.afterService?.audioReplayPublication)} />
              <Field label="Publication replay vidéo" value={statusLabel(d.afterService?.videoReplayPublication)} />
              <Field label="Archivage fichiers" value={statusLabel(d.afterService?.fileArchiving)} />
            </div>
          </Section>
          {d.generalObservations && (
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3">{d.generalObservations}</p>
          )}
        </>
      );
    }
    default:
      return null;
  }
}

export default function CulteReportPreviewModal({ report, isOpen, onClose }: CulteReportPreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aperçu — ${CULTE_REPORT_TYPE_LABELS[report.reportType]}`}>
      <div className="px-6 pt-4">
        <button
          onClick={() => exportCulteReportPdf(report)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00665C] text-white text-sm rounded-lg hover:bg-[#00665C]/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Télécharger en PDF
        </button>
      </div>
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {renderBody(report)}
        {report.notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap text-gray-800">{report.notes}</p>
          </Section>
        )}
      </div>
    </Modal>
  );
}
