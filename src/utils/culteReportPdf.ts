import { jsPDF } from 'jspdf';
import {
  CulteReport,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  SonoReportData,
  AcademieReportData,
} from '../types/culteReport.types';

const GREEN = [0, 102, 92] as [number, number, number]; // #00665C
const GOLD = [242, 182, 54] as [number, number, number]; // #F2B636
const DARK = [31, 41, 55] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const LGRAY = [243, 244, 246] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

const CHURCH = "Vases d'Honneur";
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

const OK_NOK: Record<string, string> = {
  OK: '✓ OK', NOK: '✗ NOK', OUI: 'Oui', NON: 'Non',
  SATISFAISANT: 'Satisfaisant', NON_SATISFAISANT: 'Non satisfaisant',
  BONNE: 'Bonne', MOYENNE: 'Moyenne', MAUVAISE: 'Mauvaise',
  EFFECTUEE: 'Effectuée', NON_EFFECTUEE: 'Non effectuée',
  PROBLEME: '⚠ Problème', EN_COURS: 'En cours',
};
const fmtStatus = (v: string) => OK_NOK[v] ?? v;

class PdfBuilder {
  doc: jsPDF;
  y: number;

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.y = 0;
  }

  header(title: string, subtitle: string) {
    const d = this.doc;
    d.setFillColor(...GREEN);
    d.rect(0, 0, PAGE_W, 28, 'F');
    d.setTextColor(...WHITE);
    d.setFontSize(8);
    d.setFont('helvetica', 'normal');
    d.text(CHURCH.toUpperCase(), MARGIN, 10);
    d.setFontSize(15);
    d.setFont('helvetica', 'bold');
    d.text(title, MARGIN, 20);
    d.setFillColor(...GOLD);
    d.rect(0, 28, PAGE_W, 2, 'F');
    d.setTextColor(...GRAY);
    d.setFontSize(9);
    d.setFont('helvetica', 'italic');
    d.text(subtitle, MARGIN, 37);
    this.y = 45;
  }

  section(label: string) {
    this.y += 4;
    const d = this.doc;
    this.checkPage();
    d.setFillColor(...GREEN);
    d.rect(MARGIN, this.y, 3, 5, 'F');
    d.setTextColor(...GREEN);
    d.setFontSize(10);
    d.setFont('helvetica', 'bold');
    d.text(label.toUpperCase(), MARGIN + 5, this.y + 4);
    this.y += 9;
    d.setDrawColor(...GREEN);
    d.setLineWidth(0.3);
    d.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 4;
  }

  row(key: string, value: string, highlight = false) {
    const d = this.doc;
    this.checkPage();
    if (highlight) {
      d.setFillColor(...LGRAY);
      d.rect(MARGIN, this.y - 3, CONTENT_W, 7, 'F');
    }
    d.setTextColor(...GRAY);
    d.setFontSize(9);
    d.setFont('helvetica', 'normal');
    d.text(key, MARGIN + 2, this.y + 1);
    d.setTextColor(...DARK);
    d.setFont('helvetica', 'bold');
    d.text(String(value), MARGIN + 70, this.y + 1);
    this.y += 7;
  }

  tableRow(col1: string, col2: string, isHeader = false) {
    const d = this.doc;
    this.checkPage();
    d.setFillColor(...(isHeader ? GREEN : LGRAY));
    d.rect(MARGIN, this.y - 4, CONTENT_W, 7, 'F');
    d.setTextColor(isHeader ? 255 : DARK[0], isHeader ? 255 : DARK[1], isHeader ? 255 : DARK[2]);
    d.setFontSize(9);
    d.setFont('helvetica', isHeader ? 'bold' : 'normal');
    d.text(col1, MARGIN + 2, this.y);
    d.text(col2, MARGIN + 120, this.y);
    this.y += 7;
  }

  table3Row(c1: string, c2: string, c3: string, isHeader = false) {
    const d = this.doc;
    this.checkPage();
    d.setFillColor(...(isHeader ? GREEN : LGRAY));
    d.rect(MARGIN, this.y - 4, CONTENT_W, 7, 'F');
    d.setTextColor(isHeader ? 255 : DARK[0], isHeader ? 255 : DARK[1], isHeader ? 255 : DARK[2]);
    d.setFontSize(9);
    d.setFont('helvetica', isHeader ? 'bold' : 'normal');
    d.text(c1, MARGIN + 2, this.y);
    d.text(c2, MARGIN + 70, this.y);
    d.text(c3, MARGIN + 140, this.y);
    this.y += 7;
  }

  totalBox(label: string, value: string) {
    const d = this.doc;
    this.checkPage();
    this.y += 2;
    d.setFillColor(...GREEN);
    d.roundedRect(MARGIN, this.y, CONTENT_W, 10, 2, 2, 'F');
    d.setTextColor(...WHITE);
    d.setFontSize(11);
    d.setFont('helvetica', 'bold');
    d.text(label, MARGIN + 4, this.y + 7);
    d.text(value, PAGE_W - MARGIN - 4, this.y + 7, { align: 'right' });
    this.y += 14;
  }

  notes(text: string) {
    if (!text) return;
    const d = this.doc;
    this.section('Notes / Observations');
    d.setFillColor(...LGRAY);
    const lines = d.splitTextToSize(text, CONTENT_W - 8) as string[];
    const h = lines.length * 5 + 8;
    d.rect(MARGIN, this.y, CONTENT_W, h, 'F');
    d.setTextColor(...DARK);
    d.setFontSize(9);
    d.setFont('helvetica', 'italic');
    d.text(lines, MARGIN + 4, this.y + 6);
    this.y += h + 4;
  }

  footer() {
    const d = this.doc;
    const pages = d.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      d.setPage(i);
      d.setFillColor(...LGRAY);
      d.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
      d.setFillColor(...GREEN);
      d.rect(0, PAGE_H - 12, PAGE_W, 1, 'F');
      d.setTextColor(...GRAY);
      d.setFontSize(7);
      d.setFont('helvetica', 'normal');
      d.text(`${CHURCH} — Document généré le ${new Date().toLocaleDateString('fr-FR')}`, MARGIN, PAGE_H - 5);
      d.text(`Page ${i} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
    }
  }

  checkPage() {
    if (this.y > PAGE_H - 25) {
      this.doc.addPage();
      this.y = 20;
    }
  }

  save(filename: string) {
    this.footer();
    this.doc.save(filename);
  }
}

function buildWorship(b: PdfBuilder, report: CulteReport) {
  const d = report.data as WorshipReportData;
  b.header('Rapport de Culte', fmtDate(report.serviceDate));

  b.section('Informations générales');
  b.row('Date', fmtDate(report.serviceDate));
  if (report.meetingTypeName) b.row('Type de rencontre', report.meetingTypeName, true);
  b.row('Thème du message', d.messageTheme || '—', true);
  b.row('Source biblique', d.messageSource || '—');
  if (d.speakerName) b.row('Prédicateur', d.speakerName, true);
  b.row('Soumis par', report.submittedByName);

  b.section('Présence');
  b.table3Row('Catégorie', 'Hommes / Garçons', 'Femmes / Filles', true);
  b.table3Row('Adultes', String(d.attendance?.adults?.men || 0), String(d.attendance?.adults?.women || 0));
  b.table3Row('Boss (servis)', String(d.attendance?.served?.men || 0), String(d.attendance?.served?.women || 0));
  b.table3Row('Enfants', String(d.attendance?.children?.boys || 0), String(d.attendance?.children?.girls || 0));
  b.y += 2;
  b.row('Blooms', String(d.attendance?.blooms || 0));
  b.row('Conversions', `H: ${d.attendance?.conversions?.men || 0}  F: ${d.attendance?.conversions?.women || 0}`, true);
  b.totalBox('Total participants', String(d.totalParticipants || 0));

  b.section('Nouveaux membres');
  b.table3Row('Catégorie', 'Hommes', 'Femmes', true);
  b.table3Row('Adultes', String(d.newMembers?.men || 0), String(d.newMembers?.women || 0));
  b.table3Row('Blooms', String(d.newMembers?.blooms || 0), '—');
  b.table3Row('Enfants', String(d.newMembers?.children || 0), '—');
  b.totalBox('Total nouveaux membres', String(d.totalNewMembers || 0));

  if (report.notes) b.notes(report.notes);
}

function buildFinance(b: PdfBuilder, report: CulteReport) {
  const d = report.data as FinanceReportData;
  b.header('Rapport Financier', fmtDate(report.serviceDate));

  b.section('Informations');
  b.row('Date du culte', fmtDate(report.serviceDate));
  if (report.meetingTypeName) b.row('Type de rencontre', report.meetingTypeName, true);
  b.row('Soumis par', report.submittedByName);

  b.section('Détail des finances');
  b.tableRow('Libellé', 'Montant (FCFA)', true);
  b.tableRow('Dîmes', `${formatNumber(d.tithes || 0)} FCFA`);
  b.tableRow('Offrandes ordinaires', `${formatNumber(d.regularOfferings || 0)} FCFA`);
  b.tableRow('Offrandes spéciales', `${formatNumber(d.specialOfferings || 0)} FCFA`);
  b.totalBox('Total des entrées', `${formatNumber(d.totalFinances || 0)} FCFA`);

  if (report.notes) b.notes(report.notes);
}

function buildAdn(b: PdfBuilder, report: CulteReport) {
  const d = report.data as AdnReportData;
  b.header('Rapport ADN / Visiteurs', fmtDate(report.serviceDate));

  b.section('Informations');
  b.row('Date', fmtDate(report.serviceDate));
  if (report.meetingTypeName) b.row('Type de rencontre', report.meetingTypeName, true);
  b.row('Soumis par', report.submittedByName);

  b.section('Visiteurs');
  b.table3Row('Catégorie', 'Hommes', 'Femmes', true);
  b.table3Row('Nouveaux visiteurs', String(d.newVisitors?.men || 0), String(d.newVisitors?.women || 0));
  b.totalBox('Total visiteurs', String(d.totalNewVisitors || 0));

  b.section('Décisions');
  b.tableRow('Type de décision', 'Nombre', true);
  b.tableRow('Veut rejoindre (H)', String(d.visitorDecisions?.wantsToJoin?.men || 0));
  b.tableRow('Veut rejoindre (F)', String(d.visitorDecisions?.wantsToJoin?.women || 0));
  b.tableRow('Décision pour Christ (H)', String(d.visitorDecisions?.wantsToGiveLifeToJesus?.men || 0));
  b.tableRow('Décision pour Christ (F)', String(d.visitorDecisions?.wantsToGiveLifeToJesus?.women || 0));
  b.tableRow('Indécis', String(d.visitorDecisions?.undecided || 0));
  b.y += 2;
  b.totalBox('Veut rejoindre (total)', String(d.totalWantsToJoin || 0));
  b.totalBox('Décision pour Christ (total)', String(d.totalWantsToGiveLifeToJesus || 0));

  if (report.notes) b.notes(report.notes);
}

function buildSainteCene(b: PdfBuilder, report: CulteReport) {
  const d = report.data as SainteCeneReportData;
  b.header('Rapport Sainte-Cène', fmtDate(report.serviceDate));

  b.section('Informations');
  b.row('Date de la célébration', fmtDate(report.serviceDate));
  if (report.meetingTypeName) b.row('Type de rencontre', report.meetingTypeName, true);
  b.row('Soumis par', report.submittedByName);

  b.section('Pains');
  b.tableRow('Statut', 'Quantité', true);
  b.tableRow('Préparés', String(d.painsPreparees || 0));
  b.tableRow('Distribués', String(d.painsDistribuees || 0));
  b.tableRow('Restants', String(d.painsRestantes || 0));

  b.section('Vins');
  b.tableRow('Statut', 'Quantité', true);
  b.tableRow('Préparés', String(d.vinsPreparees || 0));
  b.tableRow('Distribués', String(d.vinsDistribuees || 0));
  b.tableRow('Restants', String(d.vinsRestantes || 0));

  if (report.notes) b.notes(report.notes);
}

function buildAcademie(b: PdfBuilder, report: CulteReport) {
  const d = report.data as AcademieReportData;
  b.header('Rapport Académie d\'Honneur', fmtDate(report.serviceDate));

  b.section('Informations de la session');
  b.row('Date', fmtDate(report.serviceDate));
  b.row('Classe', d.className || '—', true);
  b.row('Modérateur', d.moderator || '—');
  b.row('Cours du jour', d.courseOfTheDay || '—', true);
  b.row('Atmosphère spirituelle', d.spiritualAtmosphere || '—');
  b.row('Participation', d.classParticipation || '—', true);
  b.row('Soumis par', report.submittedByName);

  b.section('Présence');
  b.row('Étudiants inscrits', String(d.actualStudents || 0));
  b.row('Étudiants présents', String(d.presentStudents || 0), true);
  const rate = d.actualStudents > 0 ? Math.round((d.presentStudents / d.actualStudents) * 100) : 0;
  b.totalBox('Taux de présence', `${rate}%`);

  b.section('Prochaine session');
  b.row('Cours prévu', d.nextCourse || '—');
  b.row('Prochain modérateur', d.nextModerator || '—', true);
  b.row('Méditation', d.nextMeditation || '—');
  b.row('Exercice', d.nextExercise || '—', true);

  if (report.notes) b.notes(report.notes);
}

function buildSono(b: PdfBuilder, report: CulteReport) {
  const d = report.data as SonoReportData;
  b.header('Rapport Sono & Médias', fmtDate(report.serviceDate));

  b.section('Informations');
  b.row('Date', fmtDate(report.serviceDate));
  b.row('Soumis par', report.submittedByName);

  b.section('Avant le culte');
  b.tableRow('Vérification', 'Statut', true);
  b.tableRow('Vérification matériel', fmtStatus(d.beforeService?.materialCheck));
  b.tableRow('Test qualité son', fmtStatus(d.beforeService?.soundQualityTest));
  b.tableRow('Test live streaming', fmtStatus(d.beforeService?.liveStreamingTest));
  b.tableRow('Test son en ligne', fmtStatus(d.beforeService?.onlineSoundTest));
  b.tableRow('Test vidéo en ligne', fmtStatus(d.beforeService?.onlineVideoTest));
  b.tableRow('Préparation équipement photo', fmtStatus(d.beforeService?.photoEquipmentPrep));

  b.section('Pendant le culte');
  b.tableRow('Élément', 'Statut', true);
  b.tableRow('Lancement proclamation', fmtStatus(d.duringService?.proclamationLaunch));
  b.tableRow('Qualité son salle', fmtStatus(d.duringService?.roomSoundQuality));
  b.tableRow('Live streaming', fmtStatus(d.duringService?.liveStreaming));
  b.tableRow('Qualité son en ligne', fmtStatus(d.duringService?.onlineSoundQuality));
  b.tableRow('Qualité vidéo en ligne', fmtStatus(d.duringService?.onlineVideoQuality));
  b.tableRow('Photos pendant culte', fmtStatus(d.duringService?.photoshootDuringService));
  if (d.duringService?.technicalProblems) {
    b.y += 2;
    b.notes('Problèmes techniques : ' + d.duringService.technicalProblems);
  }

  b.section('Après le culte');
  b.tableRow('Élément', 'Statut', true);
  b.tableRow('Photos servants', fmtStatus(d.afterService?.servantsPhotos));
  b.tableRow('Masquage photos', fmtStatus(d.afterService?.photoMasking));
  b.tableRow('Publication replay audio', fmtStatus(d.afterService?.audioReplayPublication));
  b.tableRow('Publication replay vidéo', fmtStatus(d.afterService?.videoReplayPublication));
  b.tableRow('Archivage fichiers', fmtStatus(d.afterService?.fileArchiving));

  if (d.generalObservations) b.notes(d.generalObservations);
  if (report.notes) b.notes(report.notes);
}

const BUILDERS: Record<CulteReport['reportType'], (b: PdfBuilder, r: CulteReport) => void> = {
  worship: buildWorship,
  finance: buildFinance,
  adn: buildAdn,
  sainte_cene: buildSainteCene,
  academie: buildAcademie,
  sono: buildSono,
};

const FILENAME_PREFIX: Record<CulteReport['reportType'], string> = {
  worship: 'rapport_culte',
  finance: 'rapport_financier',
  adn: 'rapport_adn',
  sainte_cene: 'rapport_sainte_cene',
  academie: 'rapport_academie',
  sono: 'rapport_sono',
};

export function exportCulteReportPdf(report: CulteReport) {
  const b = new PdfBuilder();
  BUILDERS[report.reportType](b, report);
  b.save(`${FILENAME_PREFIX[report.reportType]}_${report.serviceDate}.pdf`);
}
