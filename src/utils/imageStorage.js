/**
 * Image Storage Utility
 *
 * Uses IndexedDB to store image blobs keyed by journal entry ID.
 * Keeps binary data out of localStorage to avoid size limits.
 */

const DB_NAME = 'mdma-guide-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an image blob for a journal entry
 * @param {string} entryId - Journal entry ID
 * @param {Blob} blob - Image blob (PNG)
 */
export async function saveImage(entryId, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, entryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get an image blob for a journal entry
 * @param {string} entryId - Journal entry ID
 * @returns {Promise<Blob|null>} The image blob, or null if not found
 */
export async function getImage(entryId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(entryId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an image for a journal entry
 * @param {string} entryId - Journal entry ID
 */
export async function deleteImage(entryId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(entryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
