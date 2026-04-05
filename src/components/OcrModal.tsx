'use client';

import { useRef, useState } from 'react';
import { updateContact } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';

interface OcrResult {
  name?: string | null;
  nameKana?: string | null;
  title?: string | null;
  department?: string | null;
  tel?: string | null;
  mobile?: string | null;
  email?: string | null;
  memo?: string | null;
}

interface Props {
  contactId: string;
  jigyoshoId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function OcrModal({ contactId, jigyoshoId, onClose, onUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleScan = async () => {
    if (!file || !preview) return;
    setScanning(true);
    try {
      const base64 = preview.split(',')[1];
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      if (!res.ok) throw new Error('OCR failed');
      const data = await res.json();
      setResult(data);
    } catch {
      alert('OCRに失敗しました。画像を確認してください。');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!result || !file) return;
    setSaving(true);
    try {
      // Upload business card image
      const timestamp = Date.now();
      const path = `business_cards/${jigyoshoId}/${contactId}_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(getFirebaseStorage(), path);
      await uploadBytes(storageRef, file);
      const businessCardUrl = await getDownloadURL(storageRef);

      const updates: Record<string, string | undefined> = { businessCardUrl };
      if (result.name) updates.name = result.name;
      if (result.nameKana) updates.nameKana = result.nameKana;
      if (result.title) updates.title = result.title;
      if (result.department) updates.department = result.department;
      if (result.tel) updates.tel = result.tel;
      if (result.mobile) updates.mobile = result.mobile;
      if (result.email) updates.email = result.email;
      if (result.memo) updates.memo = result.memo;

      await updateContact(contactId, updates);
      onUpdated();
      onClose();
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">名刺OCR</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition"
          >
            {preview ? (
              <img src={preview} alt="名刺" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="space-y-2">
                <svg className="w-10 h-10 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-500">名刺を撮影 / 画像を選択</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

          {file && !result && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {scanning ? 'OCR解析中...' : 'AIで名刺を読み取る'}
            </button>
          )}

          {result && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">読み取り結果</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: '氏名', value: result.name },
                  { label: 'フリガナ', value: result.nameKana },
                  { label: '役職', value: result.title },
                  { label: '部署', value: result.department },
                  { label: 'TEL', value: result.tel },
                  { label: '携帯', value: result.mobile },
                  { label: 'メール', value: result.email },
                  { label: 'メモ', value: result.memo },
                ].filter(item => item.value).map(({ label, value }) => (
                  <div key={label} className="flex gap-2">
                    <span className="w-16 text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
                    <span className="text-gray-700 text-xs">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? '保存中...' : '担当者情報を更新'}
                </button>
                <button
                  onClick={() => { setResult(null); setPreview(null); setFile(null); }}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition"
                >
                  やり直す
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
