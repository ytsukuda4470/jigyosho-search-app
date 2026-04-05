import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type {
  JigyoshoNote,
  NoteType,
  VisitLog,
  VisitMethod,
  Contact,
  ContactStatus,
  JigyoshoDocument,
  DocumentCategory,
  JigyoshoStatus,
  RelationStatus,
} from './types';

// ── Notes ──────────────────────────────────────────────
const NOTES_COLLECTION = 'jigyosho_notes';

function docToNote(id: string, data: Record<string, unknown>): JigyoshoNote {
  return {
    id,
    jigyoshoId: data.jigyoshoId as string,
    type: data.type as NoteType,
    title: data.title as string,
    content: (data.content as string) || '',
    fileUrl: data.fileUrl as string | undefined,
    fileName: data.fileName as string | undefined,
    fileMimeType: data.fileMimeType as string | undefined,
    driveUrl: data.driveUrl as string | undefined,
    tags: data.tags as string[] | undefined,
    createdBy: data.createdBy as string,
    createdByName: data.createdByName as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getNotes(jigyoshoId: string): Promise<JigyoshoNote[]> {
  const q = query(
    collection(getDb(), NOTES_COLLECTION),
    where('jigyoshoId', '==', jigyoshoId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToNote(d.id, d.data()));
}

export async function addNote(
  note: Omit<JigyoshoNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(getDb(), NOTES_COLLECTION), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(
  noteId: string,
  data: Partial<Pick<JigyoshoNote, 'title' | 'content' | 'type' | 'fileUrl' | 'fileName' | 'fileMimeType' | 'driveUrl' | 'tags'>>
): Promise<void> {
  await updateDoc(doc(getDb(), NOTES_COLLECTION, noteId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(getDb(), NOTES_COLLECTION, noteId));
}

// ── Visit Logs ──────────────────────────────────────────
const VISITS_COLLECTION = 'visit_logs';

function docToVisit(id: string, data: Record<string, unknown>): VisitLog {
  return {
    id,
    jigyoshoId: data.jigyoshoId as string,
    jigyoshoName: data.jigyoshoName as string,
    date: data.date as string,
    method: data.method as VisitMethod,
    contact: (data.contact as string) || '',
    content: (data.content as string) || '',
    nextAction: data.nextAction as string | undefined,
    nextDate: data.nextDate as string | undefined,
    createdBy: data.createdBy as string,
    createdByName: data.createdByName as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getVisitLogs(jigyoshoId: string): Promise<VisitLog[]> {
  const q = query(
    collection(getDb(), VISITS_COLLECTION),
    where('jigyoshoId', '==', jigyoshoId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToVisit(d.id, d.data()));
}

export async function getAllVisitLogs(limitCount = 50): Promise<VisitLog[]> {
  const q = query(
    collection(getDb(), VISITS_COLLECTION),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToVisit(d.id, d.data()));
}

export async function addVisitLog(
  visitLog: Omit<VisitLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(getDb(), VISITS_COLLECTION), {
    ...visitLog,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteVisitLog(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), VISITS_COLLECTION, id));
}

// ── Contacts ────────────────────────────────────────────
const CONTACTS_COLLECTION = 'contacts';

function docToContact(id: string, data: Record<string, unknown>): Contact {
  return {
    id,
    jigyoshoId: data.jigyoshoId as string,
    name: data.name as string,
    nameKana: data.nameKana as string | undefined,
    title: (data.title as string) || '',
    department: data.department as string | undefined,
    tel: data.tel as string | undefined,
    mobile: data.mobile as string | undefined,
    email: data.email as string | undefined,
    status: (data.status as ContactStatus) || '在職',
    statusNote: data.statusNote as string | undefined,
    statusDate: data.statusDate as string | undefined,
    memo: data.memo as string | undefined,
    businessCardUrl: data.businessCardUrl as string | undefined,
    createdBy: data.createdBy as string,
    createdByName: data.createdByName as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getContacts(jigyoshoId: string): Promise<Contact[]> {
  const q = query(
    collection(getDb(), CONTACTS_COLLECTION),
    where('jigyoshoId', '==', jigyoshoId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToContact(d.id, d.data()));
}

export async function addContact(
  contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(getDb(), CONTACTS_COLLECTION), {
    ...contact,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateContact(
  contactId: string,
  data: Partial<Omit<Contact, 'id' | 'jigyoshoId' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await updateDoc(doc(getDb(), CONTACTS_COLLECTION, contactId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContact(contactId: string): Promise<void> {
  await deleteDoc(doc(getDb(), CONTACTS_COLLECTION, contactId));
}

// ── Documents ───────────────────────────────────────────
const DOCS_COLLECTION = 'jigyosho_documents';

function docToDocument(id: string, data: Record<string, unknown>): JigyoshoDocument {
  return {
    id,
    jigyoshoId: data.jigyoshoId as string,
    category: data.category as DocumentCategory,
    title: data.title as string,
    fileUrl: data.fileUrl as string,
    fileName: data.fileName as string,
    fileMimeType: data.fileMimeType as string,
    fileSize: data.fileSize as number | undefined,
    memo: data.memo as string | undefined,
    createdBy: data.createdBy as string,
    createdByName: data.createdByName as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getDocuments(jigyoshoId: string): Promise<JigyoshoDocument[]> {
  const q = query(
    collection(getDb(), DOCS_COLLECTION),
    where('jigyoshoId', '==', jigyoshoId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToDocument(d.id, d.data()));
}

export async function addDocument(
  document: Omit<JigyoshoDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(getDb(), DOCS_COLLECTION), {
    ...document,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteDocument(docId: string): Promise<void> {
  await deleteDoc(doc(getDb(), DOCS_COLLECTION, docId));
}

// ── Jigyosho Status ─────────────────────────────────────
const STATUS_COLLECTION = 'jigyosho_status';

function docToStatus(id: string, data: Record<string, unknown>): JigyoshoStatus {
  return {
    jigyoshoId: id,
    relationStatus: (data.relationStatus as RelationStatus) || '未接触',
    websiteUrl: data.websiteUrl as string | undefined,
    websiteSummary: data.websiteSummary as string | undefined,
    websiteUpdatedAt: (data.websiteUpdatedAt as Timestamp)?.toDate(),
    starred: (data.starred as boolean) || false,
    assignedTo: data.assignedTo as string | undefined,
    updatedBy: data.updatedBy as string,
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getJigyoshoStatus(jigyoshoId: string): Promise<JigyoshoStatus | null> {
  const snap = await getDoc(doc(getDb(), STATUS_COLLECTION, jigyoshoId));
  if (!snap.exists()) return null;
  return docToStatus(snap.id, snap.data());
}

export async function upsertJigyoshoStatus(
  jigyoshoId: string,
  data: Partial<Omit<JigyoshoStatus, 'jigyoshoId' | 'updatedAt'>>
): Promise<void> {
  await setDoc(
    doc(getDb(), STATUS_COLLECTION, jigyoshoId),
    { ...data, jigyoshoId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getStarredJigyosho(): Promise<JigyoshoStatus[]> {
  const q = query(
    collection(getDb(), STATUS_COLLECTION),
    where('starred', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToStatus(d.id, d.data()));
}

export async function getUpcomingActions(limitCount = 20): Promise<VisitLog[]> {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(getDb(), VISITS_COLLECTION),
    where('nextDate', '>=', today),
    orderBy('nextDate', 'asc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToVisit(d.id, d.data()));
}
