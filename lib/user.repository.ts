import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

export async function createUser(data: {
  name?: string;
  email: string;
  role?: "officer" | "viewer";
}) {
  await db.insert(users).values({
    id: randomUUID(),
    name: data.name,
    email: data.email,
    role: data.role ?? "officer",
  });
}
