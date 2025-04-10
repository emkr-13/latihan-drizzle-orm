import { db } from "../config/db";
import { users } from "../models/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";
import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters long")
    .regex(
      /^[a-z0-9_]+$/,
      "Username must only contain lowercase letters, numbers, and underscores"
    ),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long"),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validasi input menggunakan Zod
    const parsedBody = registerSchema.safeParse(req.body);

    if (!parsedBody.success) {
      // Jika validasi gagal, kirim pesan error
      res.status(400).json({
        error: "Validation failed",
        details: parsedBody.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = parsedBody.data;

    // Cek apakah username sudah ada di database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUser.length > 0) {
      res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user baru ke database
    const newUser = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
      })
      .returning();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
    }

    // Cari user berdasarkan username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    // Jika user tidak ditemukan
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate token
    let authToken: string, refreshToken: string | undefined;
    try {
      authToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: parseInt(process.env.AUTH_TOKEN_EXP!),
      });

      refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: parseInt(process.env.REFRESH_TOKEN_EXP!),
      });

      if (!refreshToken) {
        throw new Error("Refresh token generation failed");
      }
    } catch (jwtError) {
      console.error("JWT generation failed:", jwtError);
      res.status(500).json({ error: "Token generation failed" });
      return;
    }

    // Update refresh token di database
    try {
      await db
        .update(users)
        .set({
          refreshToken,
          refreshTokenExp: new Date(
            Date.now() + parseInt(process.env.REFRESH_TOKEN_EXP!) * 1000
          ),
        })
        .where(eq(users.id, user.id));
    } catch (dbError) {
      console.error("Database update failed:", dbError);
      res.status(500).json({ error: "Failed to update refresh token" });
      return;
    }

    // Kirim respons sukses
    res.status(200).json({
      message: "Login successful",
      authToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Unexpected error during login:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ambil user ID dari request (dari middleware authenticate)
    const userId = (req as any).user.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    // Hapus refresh token dari database
    await db
      .update(users)
      .set({
        refreshToken: null,
        refreshTokenExp: null,
      })
      .where(eq(users.id, userId));

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

function async(
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>>,
  next: NextFunction
): Promise<void> {
  throw new Error("Function not implemented.");
}
