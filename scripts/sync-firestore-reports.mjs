// Synchronisation des rapports de l'ancienne plateforme (Firestore, projet gestion-chad3)
// vers Bergerie (Supabase). Idempotent : seuls les documents absents de Postgres
// (compares par legacy_firestore_id) sont importes.
//
// Usage :
//   set FIREBASE_KEY_FILE=C:\chemin\vers\gestion-chad3-firebase-adminsdk-*.json
//   set SUPABASE_MGMT_TOKEN=sbp_...
//   node scripts/sync-firestore-reports.mjs            (dry-run : montre ce qui serait importe)
//   node scripts/sync-firestore-reports.mjs --apply    (importe reellement)
//
// Prerequis : npm install firebase-admin dans un dossier de travail quelconque,
// puis lancer le script DEPUIS ce dossier avec son chemin complet
// (firebase-admin est charge depuis le dossier courant, pas depuis le depot).
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const requireFromCwd = createRequire(pathToFileURL(process.cwd() + '/'));
const { initializeApp, cert } = requireFromCwd('firebase-admin/app');
const { getFirestore } = requireFromCwd('firebase-admin/firestore');

const KEY_FILE = process.env.FIREBASE_KEY_FILE;
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
if (!KEY_FILE || !MGMT_TOKEN) {
  console.error('Definir FIREBASE_KEY_FILE et SUPABASE_MGMT_TOKEN (voir en-tete du script).');
  process.exit(1);
}
const APPLY = process.argv.includes('--apply');
const MGMT_URL = 'https://api.supabase.com/v1/projects/mowsaahfkkygveqhkvup/database/query';

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_FILE, 'utf8'))) });
const db = getFirestore();

async function pgQuery(query) {
  const r = await fetch(MGMT_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

const CHURCH_ID = 'bergerie';

// Mapping collection Firestore -> type de rapport + departement Bergerie
const COLLECTIONS = {
  worshipReports:    { type: 'worship',     deptId: 'x3y3uiYTigvXbikv3UId', deptName: 'GESTION DES CULTES' },
  adnReports:        { type: 'adn',         deptId: '43RfvwVIY8INqang0vKp', deptName: 'AMIS DES NOUVEAUX' },
  financeReports:    { type: 'finance',     deptId: 'pWBzYN3XwzeeOrWhuGIe', deptName: 'EMMERAUDE' },
  sainteCeneReports: { type: 'sainte_cene', deptId: 'lAdLXujrJNKr8PDy5DEH', deptName: 'SAINTE CENE' },
  sonoReports:       { type: 'sono',        deptId: 'QpFTn6behEIrHByDMCPP', deptName: 'COM & SONO' },
  academieReports:   { type: 'academie',    deptId: '9TOZo9Ba2W2vU4NLTugd', deptName: "ACADEMIE D'HONNEUR" },
};

// Champs communs extraits vers les colonnes : tout le reste part dans data JSONB
const COMMON_FIELDS = new Set([
  'date', 'meetingTypeId', 'notes', 'needsNotes', 'worshipReportId',
  'createdAt', 'createdBy', 'updatedAt',
  // worship uniquement : champs ignores par la migration d'origine
  'cellName', 'sourceChurch', 'speakerId',
]);

const tsToIso = (v) => (v?.toDate ? v.toDate().toISOString() : (typeof v === 'string' ? v : null));
const esc = (s) => String(s).replace(/'/g, "''");

async function buildData(collName, d) {
  const data = {};
  for (const [k, v] of Object.entries(d)) {
    if (COMMON_FIELDS.has(k)) continue;
    if (collName === 'financeReports' && k === 'finances') continue; // aplati ci-dessous
    data[k] = v;
  }
  if (collName === 'financeReports' && d.finances) Object.assign(data, d.finances);
  if (collName === 'worshipReports' && d.speakerId) {
    const sp = await db.collection('speakers').doc(d.speakerId).get();
    data.speakerName = sp.exists ? (sp.data().name || null) : null;
  }
  return data;
}

// Resout l'auteur : cherche une ligne deja migree avec le meme createdBy Firestore
const authorCache = new Map();
async function resolveAuthor(collName, createdBy) {
  if (!createdBy) return { id: null, name: 'Inconnu (ancien systeme)' };
  if (authorCache.has(createdBy)) return authorCache.get(createdBy);
  let result = { id: null, name: 'Inconnu (ancien systeme)' };
  try {
    const ref = await db.collection(collName).where('createdBy', '==', createdBy).limit(10).get();
    const ids = ref.docs.map(x => x.id);
    if (ids.length) {
      const rows = await pgQuery(
        `SELECT submitted_by, submitted_by_name FROM culte_reports
         WHERE legacy_firestore_id IN (${ids.map(i => `'${esc(i)}'`).join(',')})
           AND submitted_by_name IS NOT NULL LIMIT 1`);
      if (rows.length) result = { id: rows[0].submitted_by, name: rows[0].submitted_by_name };
    }
  } catch { /* fallback inconnu */ }
  authorCache.set(createdBy, result);
  return result;
}

let totalNew = 0;

for (const [collName, meta] of Object.entries(COLLECTIONS)) {
  const snap = await db.collection(collName).get();
  const pgRows = await pgQuery(
    `SELECT legacy_firestore_id FROM culte_reports WHERE report_type='${meta.type}' AND legacy_firestore_id IS NOT NULL`);
  const existing = new Set(pgRows.map(r => r.legacy_firestore_id));
  const newDocs = snap.docs.filter(doc => !existing.has(doc.id));
  console.log(`${collName}: Firestore=${snap.size}, Bergerie=${existing.size}, nouveaux=${newDocs.length}`);

  for (const doc of newDocs) {
    totalNew++;
    const d = doc.data();

    // Type de rencontre : direct, ou herite du rapport de culte parent
    let mtId = null, mtName = null;
    if (d.meetingTypeId) {
      const mt = await pgQuery(`SELECT id, name FROM culte_report_meeting_types WHERE legacy_firestore_id='${esc(d.meetingTypeId)}'`);
      if (mt.length) { mtId = mt[0].id; mtName = mt[0].name; }
    }

    // Lien vers le rapport de culte parent (deja migre ou importe dans ce meme run)
    let worshipRowId = null;
    if (d.worshipReportId) {
      const parent = await pgQuery(`SELECT id, meeting_type_id, meeting_type_name FROM culte_reports WHERE legacy_firestore_id='${esc(d.worshipReportId)}'`);
      if (parent.length) {
        worshipRowId = parent[0].id;
        if (!mtId) { mtId = parent[0].meeting_type_id; mtName = parent[0].meeting_type_name; }
      }
    }

    const author = await resolveAuthor(collName, d.createdBy);
    const data = await buildData(collName, d);

    const row = {
      church_id: CHURCH_ID,
      report_type: meta.type,
      department_id: meta.deptId,
      department_name: meta.deptName,
      worship_report_id: worshipRowId,
      service_date: d.date || tsToIso(d.createdAt)?.slice(0, 10),
      meeting_type_id: mtId,
      meeting_type_name: mtName,
      submitted_by: author.id,
      submitted_by_name: author.name,
      data,
      notes: d.notes || null,
      needs_notes: d.needsNotes || null,
      legacy_firestore_id: doc.id,
      created_at: tsToIso(d.createdAt) || new Date().toISOString(),
    };

    console.log(`  -> ${meta.type} ${row.service_date} (${doc.id}) par ${row.submitted_by_name}${APPLY ? '' : ' [dry-run]'}`);

    if (APPLY) {
      const payload = esc(JSON.stringify([row]));
      const inserted = await pgQuery(`
        INSERT INTO culte_reports (church_id, report_type, department_id, department_name, worship_report_id,
          service_date, meeting_type_id, meeting_type_name, submitted_by, submitted_by_name, data, notes,
          needs_notes, legacy_firestore_id, created_at)
        SELECT church_id, report_type, department_id, department_name, worship_report_id::uuid,
          service_date::date, meeting_type_id::uuid, meeting_type_name, submitted_by, submitted_by_name,
          data, notes, needs_notes, legacy_firestore_id, created_at::timestamptz
        FROM jsonb_to_recordset('${payload}'::jsonb) AS t(
          church_id text, report_type text, department_id text, department_name text, worship_report_id text,
          service_date text, meeting_type_id text, meeting_type_name text, submitted_by text,
          submitted_by_name text, data jsonb, notes text, needs_notes text, legacy_firestore_id text, created_at text)
        ON CONFLICT (church_id, report_type, legacy_firestore_id) DO NOTHING
        RETURNING id;`);
      console.log(`     insere: ${inserted.length ? inserted[0].id : 'deja present'}`);
    }
  }
}

console.log(`\nTotal nouveaux documents: ${totalNew}${APPLY ? ' (importes)' : ' (dry-run, rien ecrit — relancer avec --apply)'}`);
