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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { JigyoshoNote, NoteType } from './types';

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
