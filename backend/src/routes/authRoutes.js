import express from 'express';
import { register, login, guestLogin, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.put('/profile', authenticate, updateProfile);

export default router;