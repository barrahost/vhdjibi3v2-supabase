/**
 * firebaseCompat.ts â Supabase-backed Firebase/Firestore API shim.
 * Aliased via vite.config.ts + tsconfig.json paths so all existing
 * components keep their firebase/firestore imports unchanged.
 */
import { supabase } from './supabase';

// ============================================================
// Collection name mapping (Firestore camelCase â Supabase snake_case)
// ============================================================
const COLLECTION_MAP: Record<string, string> = {
  souls:             'souls',
  users:             'users',
  admins:            'admins',
  servants:          'servants',
  departments:       'departments',
  serviceFamilies:   'service_families',
  service_families:  'service_families',
  evangelizedSouls:  'evangelized_souls',
  evangelized_souls: 'evangelized_souls',
  interactions:      'interactions',
  attendances:       'attendances',
  teachings:         'teachings',
  audio_categories:  'audio_categories',
  announcements:     'announcements',
  announcement_logs: 'announcement_logs',
  birthdays:         'birthdays',
  sms_templates:     'sms_templates',
  sms_categories:    'sms_categories',
};

function getTable(col: string): string {
  return COLLECTION_MAP[col] ?? camelToSnake(col);
}

// ============================================================
// Case helpers
// ============================================================
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
}
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}
// Detect Postgres/ISO timestamp strings from Supabase and auto-convert to Timestamp
function isDateString(v: any): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}
function rowToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(rowToCamel);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      snakeToCamel(k),
      isDateString(v) ? Timestamp.fromDate(new Date(v)) : v
    ])
  );
}
function dataToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (obj && typeof (obj as any).toDate === 'function') return (obj as any).toDate().toISOString();
  if (obj && (obj as any)._increment !== undefined) return (obj as any)._increment;
  if (Array.isArray(obj)) return obj.map(dataToSnake);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), dataToSnake(v)]));
}

// ============================================================
// Internal ref types
// ============================================================
interface _Constraint {
  _type: 'where' | 'orderBy' | 'limit';
  field?: string; op?: string; value?: any;
  direction?: 'asc' | 'desc'; n?: number;
}

// QueryLike also serves as CollectionRef (empty constraints = no filter)
export interface _QueryLike { _collection: string; _constraints: _Constraint[] }

export interface _DocumentRef {
  _collection: string;
  _id: string;
  /** Alias for _id â mirrors Firebase's DocumentReference.id */
  id: string;
}

// ============================================================
// Public snapshot types
// ============================================================
export interface DocumentSnapshot {
  id: string;
  /** Fake ref object so components that read .ref.id don't crash */
  ref: _DocumentRef;
  exists(): boolean;
  data(): Record<string, any>;
}

export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  empty: boolean;
  size: number;
  forEach(cb: (doc: DocumentSnapshot) => void): void;
}

// Re-export type aliases used as TS types in some components
export type DocumentReference<T = any>       = _DocumentRef;
export type CollectionReference<T = any>     = _QueryLike;
export type Query<T = any>                   = _QueryLike;
export type QueryDocumentSnapshot<T = any>   = DocumentSnapshot;
export type DocumentData                     = Record<string, any>;
export type WhereFilterOp = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';

// ============================================================
// Fake db sentinel (only used as first arg to doc/collection)
// ============================================================
export const db: any = {};

// ============================================================
// collection()
// ============================================================
export function collection(_db: any, name: string): _QueryLike {
  return { _collection: name, _constraints: [] };
}

// ============================================================
// doc()
// ============================================================
function makeDocRef(collection: string, id: string): _DocumentRef {
  return { _collection: collection, _id: id, id };
}

/** doc(collectionRef) â auto-ID new document reference */
export function doc(collectionRef: _QueryLike): _DocumentRef;
/** doc(db, 'collection', 'id') */
export function doc(db: any, collection: string, id: string): _DocumentRef;
/** doc(collectionRef, 'id') */
export function doc(collectionRef: _QueryLike, id: string): _DocumentRef;
export function doc(dbOrRef: any, collectionOrId?: string, maybeId?: string): _DocumentRef {
  if (collectionOrId === undefined) {
    // doc(collectionRef) â generate new auto-ID
    return makeDocRef(dbOrRef._collection ?? '', crypto.randomUUID());
  }
  if (maybeId !== undefined) {
    // doc(db, 'collection', 'id')
    return makeDocRef(collectionOrId, maybeId);
  }
  // doc(collectionRef, 'id')
  return makeDocRef(dbOrRef._collection ?? '', collectionOrId);
}

// ============================================================
// Query constraints
// ============================================================
export function where(field: string, op: string, value: any): _Constraint {
  return { _type: 'where', field, op, value };
}
export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): _Constraint {
  return { _type: 'orderBy', field, direction };
}
export function limit(n: number): _Constraint {
  return { _type: 'limit', n };
}
export function documentId(): string { return 'id'; }

// ============================================================
// query()
// ============================================================
export function query(ref: _QueryLike, ...constraints: _Constraint[]): _QueryLike {
  return { _collection: ref._collection, _constraints: [...ref._constraints, ...constraints] };
}

// ============================================================
// Apply constraints to a Supabase query builder
// ============================================================
// Convert Date objects to ISO strings for Supabase compatibility
function serializeValue(v: any): any {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate().toISOString();
  return v;
}

// ============================================================
function applyConstraints(sbq: any, constraints: _Constraint[]): any {
  for (const c of constraints) {
    if (c._type === 'where') {
      const col = camelToSnake(c.field!);
      switch (c.op) {
        case '==':               sbq = sbq.eq(col, serializeValue(c.value)); break;
        case '!=':               sbq = sbq.neq(col, serializeValue(c.value)); break;
        case '>':                sbq = sbq.gt(col, serializeValue(c.value)); break;
        case '>=':               sbq = sbq.gte(col, serializeValue(c.value)); break;
        case '<':                sbq = sbq.lt(col, serializeValue(c.value)); break;
        case '<=':               sbq = sbq.lte(col, serializeValue(c.value)); break;
        case 'in':               sbq = sbq.in(col, c.value); break;
        case 'not-in':           sbq = sbq.not(col, 'in', `(${(c.value as any[]).join(',')})`); break;
        case 'array-contains':   sbq = sbq.contains(col, [c.value]); break;
        case 'array-contains-any': sbq = sbq.overlaps(col, c.value); break;
      }
    } else if (c._type === 'orderBy') {
      sbq = sbq.order(camelToSnake(c.field!), { ascending: c.direction !== 'desc' });
    } else if (c._type === 'limit') {
      sbq = sbq.limit(c.n!);
    }
  }
  return sbq;
}

function makeDocSnap(row: any): DocumentSnapshot {
  const camel = rowToCamel(row);
  const { id, ...rest } = camel;
  const docId = id ?? row?.id ?? '';
  return {
    id: docId,
    ref: makeDocRef('', docId),
    exists: () => true,
    data: () => rest,
  };
}

function makeQuerySnap(rows: any[]): QuerySnapshot {
  const docs = (rows ?? []).map(makeDocSnap);
  return { docs, empty: docs.length === 0, size: docs.length, forEach: cb => docs.forEach(cb) };
}

// ============================================================
// getDocs
// ============================================================
export async function getDocs(q: _QueryLike): Promise<QuerySnapshot> {
  const table = getTable(q._collection);
  let sbq = (supabase as any).from(table).select('*');
  sbq = applyConstraints(sbq, q._constraints ?? []);
  const { data, error } = await sbq;
  if (error) throw error;
  return makeQuerySnap(data ?? []);
}

// ============================================================
// getDoc
// ============================================================
export async function getDoc(docRef: _DocumentRef): Promise<DocumentSnapshot> {
  const table = getTable(docRef._collection);
  const { data, error } = await (supabase as any)
    .from(table).select('*').eq('id', docRef._id).limit(1);
  if (error) throw error;
  if (!data || data.length === 0) {
    return {
      id: docRef._id,
      ref: makeDocRef(docRef._collection, docRef._id),
      exists: () => false,
      data: () => ({}),
    };
  }
  return makeDocSnap(data[0]);
}

// ============================================================
// addDoc
// ============================================================
export async function addDoc(ref: _QueryLike, data: any): Promise<_DocumentRef> {
  const table = getTable(ref._collection);
  const id = data.id || crypto.randomUUID();
  const snaked = dataToSnake({ ...data, id });
  const { error } = await (supabase as any).from(table).insert(snaked);
  if (error) throw error;
  return makeDocRef(ref._collection, id);
}

// ============================================================
// setDoc
// ============================================================
export async function setDoc(
  docRef: _DocumentRef,
  data: any,
  _options?: { merge?: boolean }
): Promise<void> {
  const table = getTable(docRef._collection);
  const snaked = dataToSnake({ ...data, id: docRef._id });
  const { error } = await (supabase as any).from(table).upsert(snaked, { onConflict: 'id' });
  if (error) throw error;
}

// ============================================================
// updateDoc â handles increment() sentinels
// ============================================================
export async function updateDoc(docRef: _DocumentRef, data: any): Promise<void> {
  const table = getTable(docRef._collection);
  const increments: Record<string, number> = {};
  const regular: Record<string, any> = {};

  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && (v as any)._increment !== undefined) {
      increments[camelToSnake(k)] = (v as any)._increment;
    } else {
      regular[k] = v;
    }
  }

  if (Object.keys(regular).length > 0) {
    const { error } = await (supabase as any).from(table).update(dataToSnake(regular)).eq('id', docRef._id);
    if (error) throw error;
  }

  for (const [col, delta] of Object.entries(increments)) {
    const { data: cur, error: e1 } = await (supabase as any).from(table).select(col).eq('id', docRef._id).limit(1);
    if (e1) throw e1;
    const { error: e2 } = await (supabase as any).from(table).update({ [col]: ((cur?.[0]?.[col] ?? 0) as number) + delta }).eq('id', docRef._id);
    if (e2) throw e2;
  }
}

// ============================================================
// deleteDoc
// ============================================================
export async function deleteDoc(docRef: _DocumentRef): Promise<void> {
  const table = getTable(docRef._collection);
  const { error } = await (supabase as any).from(table).delete().eq('id', docRef._id);
  if (error) throw error;
}

// ============================================================
// onSnapshot
// ============================================================
type SnapshotCb = (snap: QuerySnapshot) => void;
type ErrorCb   = (err: Error) => void;
type Unsub     = () => void;

export function onSnapshot(q: _QueryLike, callback: SnapshotCb, onErr?: ErrorCb): Unsub;
export function onSnapshot(q: _DocumentRef, callback: SnapshotCb, onErr?: ErrorCb): Unsub;
export function onSnapshot(
  q: _QueryLike | _DocumentRef,
  callback: SnapshotCb,
  onErr?: ErrorCb
): Unsub {
  const isDoc = '_id' in q;

  const fetchAndNotify = async () => {
    try {
      if (isDoc) {
        const snap = await getDoc(q as _DocumentRef);
        callback({
          docs: snap.exists() ? [snap] : [],
          empty: !snap.exists(),
          size: snap.exists() ? 1 : 0,
          forEach: fn => { if (snap.exists()) fn(snap); },
        });
      } else {
        callback(await getDocs(q as _QueryLike));
      }
    } catch (err) {
      onErr && onErr(err as Error);
    }
  };

  fetchAndNotify();

  const table = getTable((q as any)._collection ?? '');
  const channelId = `compat-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const channel = (supabase as any)
    .channel(channelId)
    .on('postgres_changes', { event: '*', schema: 'public', table }, fetchAndNotify)
    .subscribe();

  return () => { (supabase as any).removeChannel(channel); };
}

// ============================================================
// writeBatch
// ============================================================
type BatchOp =
  | { type: 'set';    ref: _DocumentRef; data: any; opts?: any }
  | { type: 'update'; ref: _DocumentRef; data: any }
  | { type: 'delete'; ref: _DocumentRef };

class WriteBatchImpl {
  private _ops: BatchOp[] = [];
  set(ref: _DocumentRef, data: any, opts?: any) { this._ops.push({ type: 'set', ref, data, opts }); return this; }
  update(ref: _DocumentRef, data: any)          { this._ops.push({ type: 'update', ref, data }); return this; }
  delete(ref: _DocumentRef)                     { this._ops.push({ type: 'delete', ref }); return this; }
  async commit() {
    await Promise.all(this._ops.map(async (op) => {
      if (op.type === 'set')    await setDoc(op.ref, op.data, op.opts);
      if (op.type === 'update') await updateDoc(op.ref, op.data);
      if (op.type === 'delete') await deleteDoc(op.ref);
    }))
  }
}
export function writeBatch(_db: any): WriteBatchImpl { return new WriteBatchImpl(); }

// ============================================================
// Timestamp
// ============================================================
export class Timestamp {
  seconds: number; nanoseconds: number;
  private _ms: number;
  constructor(seconds: number, nanoseconds = 0) {
    this.seconds = seconds; this.nanoseconds = nanoseconds;
    this._ms = seconds * 1000 + nanoseconds / 1e6;
  }
  static fromDate(d: Date): Timestamp { return new Timestamp(Math.floor(d.getTime() / 1000)); }
  static now(): Timestamp { return Timestamp.fromDate(new Date()); }
  toDate(): Date { return new Date(this._ms); }
  toMillis(): number { return this._ms; }
  isEqual(o: Timestamp): boolean { return this._ms === o._ms; }
  toString(): string { return new Date(this._ms).toISOString(); }
  toJSON() { return this.toString(); }
}

// ============================================================
// Misc helpers
// ============================================================
export function increment(n: number) { return { _increment: n }; }

// Alias for backward compatibility
export const onData = onSnapshot;
