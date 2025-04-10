import { Request, Response } from "express";
import { db } from "../config/db";
import { books } from "../models/book";
import { eq, isNull } from "drizzle-orm";

// Create a new book
export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, author, year } = req.body;

    if (!title || !author || !year) {
      res.status(400).json({ error: "All fields are required" });
    }

    const newBook = await db
      .insert(books)
      .values({
        title,
        author,
        year,
      })
      .returning();

    res.status(201).json({ message: "Book created", book: newBook[0] });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book" });
  }
};

// Get all books
export const getAllBooks = async (_req: Request, res: Response) => {
  try {
    const allBooks = await db.select().from(books).where(isNull(books.deletedAt));
    res.status(200).json({ message: 'Books retrieved successfully', books: allBooks });
  } catch (error) {
    console.error('Error retrieving books:', error);
    res.status(500).json({ error: 'Failed to retrieve books' });
  }
};

// Get a single book by ID
export const getBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = parseInt(req.params.id || req.body.bookId);

    if (isNaN(bookId)) {
      res.status(400).json({ error: "Invalid book ID" });
    }

    const [book] = await db.select().from(books).where(eq(books.id, bookId));

    if (!book) {
      res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json({ message: "Book retrieved successfully", book });
  } catch (error) {
    console.error("Error retrieving book:", error);
    res.status(500).json({ error: "Failed to retrieve book" });
  }
};

// Update a book
export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = parseInt(req.params.id || req.body.bookId);
    const { title, author, year } = req.body;

    if (isNaN(bookId)) {
      res.status(400).json({ error: "Invalid book ID" });
    }
    const updatedBook = await db
      .update(books)
      .set({
        title,
        author,
        year,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning();

    if (!updatedBook[0]) {
      res.status(404).json({ error: "Book not found" });
    }

    res
      .status(200)
      .json({ message: "Book updated successfully", book: updatedBook[0] });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
};

// Delete a book
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = parseInt(req.params.id || req.body.bookId);

    if (isNaN(bookId)) {
      res.status(400).json({ error: "Invalid book ID" });
    }

    // Update deleted_at untuk soft delete
    const updatedBook = await db
      .update(books)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning();

    if (!updatedBook[0]) {
      res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json({
      message: "Book soft-deleted successfully",
      book: updatedBook[0],
    });
  } catch (error) {
    console.error("Error soft-deleting book:", error);
    res.status(500).json({ error: "Failed to soft-delete book" });
  }
};
