/**
 * Crypto Service
 * Device-bound encryption for API keys using Web Crypto API
 * Keys stored in IndexedDB (more secure than localStorage)
 */

const DB_NAME = 'mdma-guide-crypto';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const DEVICE_KEY_ID = 'device-key';

/**
 * Open IndexedDB connection
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generate a new AES-256-GCM key for device-bound encryption
 */
async function generateDeviceKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable (needed for storage)
    ['encrypt', 'decrypt']
  );

  // Export key for storage
  const exportedKey = await crypto.subtle.exportKey('jwk', key);

  // Store in IndexedDB
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put({ id: DEVICE_KEY_ID, key: exportedKey });
    request.onsuccess = () => resolve(key);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve device key from IndexedDB, generate if not exists
 */
async function getDeviceKey() {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(DEVICE_KEY_ID);

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      if (request.result) {
        // Import the stored key
        const key = await crypto.subtle.importKey(
          'jwk',
          request.result.key,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        resolve(key);
      } else {
        // Generate new key if none exists
        const newKey = await generateDeviceKey();
        resolve(newKey);
      }
    };
  });
}

/**
 * Encrypt an API key using device-bound encryption
 * @param {string} plainKey - The API key to encrypt
 * @returns {Promise<{iv: string, ciphertext: string}>} - Encrypted data as base64 strings
 */
export async function encryptApiKey(plainKey) {
  const deviceKey = await getDeviceKey();

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    deviceKey,
    encoder.encode(plainKey)
  );

  // Convert to base64 for storage
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
}

/**
 * Decrypt an API key using device-bound encryption
 * @param {{iv: string, ciphertext: string}} encryptedData - Encrypted data from encryptApiKey
 * @returns {Promise<string>} - The decrypted API key
 */
export async function decryptApiKey(encryptedData) {
  if (!encryptedData || !encryptedData.iv || !encryptedData.ciphertext) {
    throw new Error('Invalid encrypted data');
  }

  const deviceKey = await getDeviceKey();

  // Convert from base64
  const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(encryptedData.ciphertext).split('').map(c => c.charCodeAt(0)));

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    deviceKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

/**
 * Check if we have an encrypted key stored
 * @param {object} encryptedData - The encrypted data object
 * @returns {boolean}
 */
export function hasEncryptedKey(encryptedData) {
  return !!(encryptedData && encryptedData.iv && encryptedData.ciphertext);
}

/**
 * Clear the device key (useful for testing or full reset)
 */
export async function clearDeviceKey() {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(DEVICE_KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
