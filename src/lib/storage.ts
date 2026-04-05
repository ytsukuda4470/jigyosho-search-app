import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './firebase';

/**
 * Firebase Storage にファイルをアップロード
 */
export async function uploadFile(
  file: File,
  jigyoshoId: string
): Promise<{ url: string; name: string; mimeType: string }> {
  const timestamp = Date.now();
  const path = `jigyosho_notes/${jigyoshoId}/${timestamp}_${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name, mimeType: file.type };
}
