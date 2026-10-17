import { jsPDF } from 'jspdf';

export function generateAcademieCertificate(studentName: string, className: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setDrawColor(0, 102, 92);
  doc.setLineWidth(2);
  doc.rect(8, 8, w - 16, h - 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 92);
  doc.text("ACADÉMIE VH AGC", w / 2, 30, { align: 'center' });

  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text('Certificat de fin de formation', w / 2, 50, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Ce certificat est décerné à', w / 2, 70, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 102, 92);
  doc.text(studentName, w / 2, 85, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(`pour avoir achevé avec succès toutes les séances de la ${className}`, w / 2, 100, { align: 'center' });
  doc.text("de l'Académie de l'Assemblée Grâce Confondante — Vases d'Honneur AGC.", w / 2, 108, { align: 'center' });

  const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Délivré le ${date}`, w / 2, h - 20, { align: 'center' });

  doc.save(`Certificat-${className.replace(/\s+/g, '-')}-${studentName.replace(/\s+/g, '-')}.pdf`);
}
