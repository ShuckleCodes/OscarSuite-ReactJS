import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = Router();

// Ensure directories exist
const GUESTS_DIR = path.join(process.cwd(), 'data', 'guests');
const NOMINEES_DIR = path.join(process.cwd(), 'data', 'nominees');

if (!fs.existsSync(GUESTS_DIR)) {
  fs.mkdirSync(GUESTS_DIR, { recursive: true });
}
if (!fs.existsSync(NOMINEES_DIR)) {
  fs.mkdirSync(NOMINEES_DIR, { recursive: true });
}

// Configure multer for guest photo uploads
const guestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GUESTS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

// Configure multer for nominee image uploads
const nomineeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, NOMINEES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

const imageFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const uploadLimits = {
  fileSize: 5 * 1024 * 1024 // 5MB limit
};

const guestUpload = multer({
  storage: guestStorage,
  fileFilter: imageFileFilter,
  limits: uploadLimits
});

const nomineeUpload = multer({
  storage: nomineeStorage,
  fileFilter: imageFileFilter,
  limits: uploadLimits
});

// POST /api/upload/photo - Upload a guest photo
router.post('/photo', guestUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      filename: req.file.filename,
      path: `guests/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// POST /api/upload/nominee-image - Upload a nominee image
router.post('/nominee-image', nomineeUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      filename: req.file.filename,
      path: `nominees/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading nominee image:', error);
    res.status(500).json({ error: 'Failed to upload nominee image' });
  }
});

export default router;
