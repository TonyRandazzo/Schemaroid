import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();
router.use(authenticate);
router.post('/', upload.single('image'), uploadImage);

export default router;