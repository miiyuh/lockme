import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import type { EncryptionMethod } from '@shared/schema';

const pipelineAsync = promisify(pipeline);

// Create temp directory for encrypted files if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Algorithm constants
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

// Key length varies based on algorithm
const KEY_LENGTHS: Record<EncryptionMethod, number> = {
  'aes-256-cbc': 32, // 256 bits
  'aes-192-cbc': 24, // 192 bits
  'aes-128-cbc': 16, // 128 bits
  'aes-256-gcm': 32, // 256 bits
  'aes-192-gcm': 24, // 192 bits
  'aes-128-gcm': 16  // 128 bits
};

// Encryption metadata
interface EncryptionMetadata {
  algorithm: EncryptionMethod;
  salt: Buffer;
  iv: Buffer;
  authTag?: Buffer; // Only for GCM mode
}

/**
 * Derives a key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer, keyLength: number): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, keyLength, 'sha256');
}

/**
 * Serializes encryption metadata to be stored at the beginning of the encrypted file
 */
function serializeMetadata(metadata: EncryptionMetadata): Buffer {
  // Store algorithm name length (1 byte) + algorithm name + salt + iv + authTag (if present)
  const algorithmBuffer = Buffer.from(metadata.algorithm);
  const algorithmLengthBuffer = Buffer.alloc(1);
  algorithmLengthBuffer.writeUInt8(algorithmBuffer.length);
  
  let buffers = [algorithmLengthBuffer, algorithmBuffer, metadata.salt, metadata.iv];
  
  if (metadata.authTag) {
    // Add auth tag for GCM mode
    buffers.push(metadata.authTag);
  }
  
  return Buffer.concat(buffers);
}

/**
 * Deserializes encryption metadata from the beginning of the encrypted file
 */
function deserializeMetadata(data: Buffer): { metadata: EncryptionMetadata; headerLength: number } {
  let offset = 0;
  
  // Read algorithm name length (first byte)
  const algorithmLength = data.readUInt8(offset);
  offset += 1;
  
  // Read algorithm name
  const algorithm = data.subarray(offset, offset + algorithmLength).toString();
  offset += algorithmLength;
  
  // Read salt
  const salt = data.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  
  // Read IV
  const iv = data.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  
  // For GCM mode, read auth tag (16 bytes)
  let authTag: Buffer | undefined;
  if (algorithm.includes('gcm')) {
    authTag = data.subarray(offset, offset + 16);
    offset += 16;
  }
  
  return {
    metadata: { algorithm: algorithm as EncryptionMethod, salt, iv, authTag },
    headerLength: offset
  };
}

/**
 * Encrypts a file using the specified encryption algorithm
 * @param inputPath Path to the input file
 * @param password Password for encryption
 * @param algorithm Encryption algorithm to use
 * @returns Path to the encrypted file and metadata
 */
export async function encryptFile(
  inputPath: string, 
  password: string, 
  algorithm: EncryptionMethod = 'aes-256-cbc'
): Promise<{ filePath: string, algorithm: EncryptionMethod }> {
  // Generate a random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from password using PBKDF2
  const keyLength = KEY_LENGTHS[algorithm];
  const key = deriveKey(password, salt, keyLength);

  // Read the input file
  const inputData = fs.readFileSync(inputPath);
  
  let encryptedData: Buffer;
  let authTag: Buffer | undefined;
  
  // Encrypt based on algorithm type
  if (algorithm.includes('gcm')) {
    // GCM mode requires special handling for auth tag
    const cipher = crypto.createCipheriv(algorithm, key, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([
      cipher.update(inputData),
      cipher.final()
    ]);
    authTag = cipher.getAuthTag(); // Get the authentication tag
    encryptedData = encrypted;
  } else {
    // CBC and other modes
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    encryptedData = Buffer.concat([
      cipher.update(inputData),
      cipher.final()
    ]);
  }
  
  // Create metadata
  const metadata: EncryptionMetadata = {
    algorithm,
    salt,
    iv,
    authTag
  };
  
  // Serialize the metadata
  const metadataBuffer = serializeMetadata(metadata);
  
  // Combine metadata and encrypted data
  const outputData = Buffer.concat([metadataBuffer, encryptedData]);
  
  // Write to output file
  const outputPath = path.join(tempDir, `${path.basename(inputPath)}.enc`);
  fs.writeFileSync(outputPath, outputData);

  return {
    filePath: outputPath,
    algorithm
  };
}

/**
 * Decrypts a file
 * @param inputPath Path to the encrypted file
 * @param password Password for decryption
 * @param outputFileName Name for the decrypted file
 * @returns Path to the decrypted file
 */
export async function decryptFile(
  inputPath: string, 
  password: string, 
  outputFileName: string
): Promise<string> {
  // Read the file
  const encryptedData = fs.readFileSync(inputPath);
  
  // Extract metadata from the beginning of the file
  const { metadata, headerLength } = deserializeMetadata(encryptedData);
  const { algorithm, salt, iv, authTag } = metadata;
  
  // Get encrypted data (everything after the header)
  const encryptedContent = encryptedData.subarray(headerLength);
  
  // Derive key from password using PBKDF2
  const keyLength = KEY_LENGTHS[algorithm];
  const key = deriveKey(password, salt, keyLength);

  let decryptedData: Buffer;
  
  // Decrypt based on algorithm type
  if (algorithm.includes('gcm')) {
    // GCM mode requires auth tag
    const decipher = crypto.createDecipheriv(algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag!);
    decryptedData = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final()
    ]);
  } else {
    // CBC and other modes
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decryptedData = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final()
    ]);
  }
  
  // Write to output file
  const outputPath = path.join(tempDir, outputFileName);
  fs.writeFileSync(outputPath, decryptedData);

  return outputPath;
}

/**
 * Cleans up a temporary file
 * @param filePath Path to the temporary file
 */
export function cleanupTempFile(filePath: string): void {
  if (fs.existsSync(filePath) && filePath.startsWith(tempDir)) {
    fs.unlinkSync(filePath);
  }
}
