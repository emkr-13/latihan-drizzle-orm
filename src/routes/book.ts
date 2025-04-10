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
router.post('/books/create', authenticate, createBook);

// Public route: Get a single book by ID
router.get('/books/detail', getBookById);

// Protected route: Update a book
router.post('/books/update', authenticate, updateBook);

// Protected route: Delete a book
router.post('/books/delete', authenticate, deleteBook);

export default router;