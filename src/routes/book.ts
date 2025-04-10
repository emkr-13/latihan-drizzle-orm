import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} from '../controllers/bookController';

const router = Router();

// Public route: Get all books
router.get('/books', getAllBooks);

// Protected route: Create a new book
router.post('/books', authenticate, createBook);

// Public route: Get a single book by ID
router.get('/books/:id', getBookById);

// Protected route: Update a book
router.put('/books/:id', authenticate, updateBook);

// Protected route: Delete a book
router.delete('/books/:id', authenticate, deleteBook);

export default router;