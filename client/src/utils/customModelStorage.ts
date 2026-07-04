const DB_NAME = 'spellbound-arena';
const DB_VERSION = 1;
const STORE_NAME = 'customModels';

interface StoredCustomModel {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: ArrayBuffer;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function saveCustomModelFile(
  userId: string,
  file: File,
): Promise<void> {
  const buffer = await file.arrayBuffer();
  const record: StoredCustomModel = {
    userId,
    fileName: file.name,
    mimeType: file.type || 'model/gltf-binary',
    buffer,
    updatedAt: new Date().toISOString(),
  };

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save custom model'));
    tx.objectStore(STORE_NAME).put(record);
  });
  db.close();
}

export async function loadCustomModelFile(
  userId: string,
): Promise<{ fileName: string; blob: Blob } | null> {
  const db = await openDatabase();
  const record = await new Promise<StoredCustomModel | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(userId);
    request.onsuccess = () => resolve((request.result as StoredCustomModel | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Failed to load custom model'));
  });
  db.close();

  if (!record) return null;

  return {
    fileName: record.fileName,
    blob: new Blob([record.buffer], { type: record.mimeType }),
  };
}

export async function deleteCustomModelFile(userId: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete custom model'));
    tx.objectStore(STORE_NAME).delete(userId);
  });
  db.close();
}

export const CUSTOM_MODEL_ACCEPT = '.glb,.gltf';
export const CUSTOM_MODEL_MAX_BYTES = 15 * 1024 * 1024;

export function isCustomModelFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return lower.endsWith('.glb') || lower.endsWith('.gltf');
}
