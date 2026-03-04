/**
 * AES-256-GCM Encryption Utility for PHI Data
 * 
 * Used to encrypt sensitive clinical data at rest in Supabase.
 * Fields like clinical notes, diagnosis details, and sensitive identifiers
 * are encrypted before storage.
 * 
 * Key is derived from ENCRYPTION_KEY environment variable.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Derives a CryptoKey from the environment encryption key
 */
async function getKey(): Promise<CryptoKey> {
    const keyMaterial = process.env.ENCRYPTION_KEY;
    if (!keyMaterial) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Import as raw key material
    const importedKey = await crypto.subtle.importKey(
        'raw',
        await crypto.subtle.digest('SHA-256', keyData),
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
    );

    return importedKey;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: base64(iv + ciphertext + tag)
 */
export async function encrypt(plaintext: string): Promise<string> {
    const key = await getKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        data
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Input: base64(iv + ciphertext + tag)
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
    const key = await getKey();

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Check if a string is encrypted (basic heuristic)
 */
export function isEncrypted(value: string): boolean {
    try {
        const decoded = atob(value);
        return decoded.length > IV_LENGTH;
    } catch {
        return false;
    }
}
