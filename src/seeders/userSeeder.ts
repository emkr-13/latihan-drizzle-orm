import { db } from "../config/db";
import { users } from "../models/user";
import bcrypt from "bcryptjs";

async function seed() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  await db.insert(users).values({
    username: "admin",
    password: hashedPassword,
  });
}

seed().then(() => {
  console.log("Seeder completed");
  process.exit();
});
