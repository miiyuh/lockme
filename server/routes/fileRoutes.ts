import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { encryptFile, decryptFile, cleanupTempFile } from '../services/encryptionService';
import { insertFileSchema, passwordSchema, encryptionMethodSchema } from '@shared/schema';
import { z } from 'zod';

// Create temp directory for uploads if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

const router = express.Router();

// Get all files
router.get('/files', async (req, res) => {
  try {
    const files = await storage.getAllFiles();
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving files", error: (error as Error).message });
  }
});

// Upload a file (unencrypted)
router.post('/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileData = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      isEncrypted: false,
      userId: null
    };

    // Validate the file data
    const validFileData = insertFileSchema.parse(fileData);
    
    // Store file metadata in database
    const savedFile = await storage.createFile(validFileData);
    
    res.status(201).json(savedFile);
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: (error as Error).message });
  }
});

// Encrypt a file
router.post('/files/:id/encrypt', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { password, encryptionMethod } = passwordSchema.parse(req.body);
    
    // Get file metadata
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Get file path
    const filePath = path.join(uploadDir, file.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on disk" });
    }
    
    // Encrypt the file
    const { filePath: encryptedFilePath, algorithm } = await encryptFile(
      filePath, 
      password, 
      encryptionMethod
    );
    
    // Update file metadata
    const encryptedFile = await storage.updateFile(fileId, {
      isEncrypted: true,
      fileName: path.basename(encryptedFilePath),
      encryptionMethod: algorithm,
    });
    
    // Delete the original file
    cleanupTempFile(filePath);
    
    res.json(encryptedFile);
  } catch (error) {
    res.status(500).json({ message: "Error encrypting file", error: (error as Error).message });
  }
});

// Decrypt a file
router.post('/files/:id/decrypt', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { password } = passwordSchema.parse(req.body);
    
    // Get file metadata
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    if (!file.isEncrypted) {
      return res.status(400).json({ message: "File is not encrypted" });
    }
    
    // Get file path
    const filePath = path.join(uploadDir, file.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on disk" });
    }
    
    // Decrypt the file
    const decryptedFilePath = await decryptFile(
      filePath, 
      password, 
      file.originalName
    );
    
    // Update file metadata
    const decryptedFile = await storage.updateFile(fileId, {
      isEncrypted: false,
      fileName: path.basename(decryptedFilePath),
    });
    
    // Return the decrypted file metadata
    res.json(decryptedFile);
  } catch (error) {
    res.status(500).json({ message: "Error decrypting file", error: (error as Error).message });
  }
});

// Download a file
router.get('/files/:id/download', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    // Get file metadata
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Get file path
    const filePath = path.join(uploadDir, file.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on disk" });
    }
    
    // Set content disposition header with the original file name
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.fileType);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Error downloading file", error: (error as Error).message });
  }
});

// Delete a file
router.delete('/files/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    // Get file metadata
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Get file path
    const filePath = path.join(uploadDir, file.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete file metadata from database
    await storage.deleteFile(fileId);
    
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting file", error: (error as Error).message });
  }
});

export default router;
