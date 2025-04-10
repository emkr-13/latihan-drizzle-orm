import { Router } from 'express';
import { register, login,logout } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected route accessed', user: (req as any).user });
});

export default router;