import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Gunakan variabel global agar tidak membuat koneksi baru setiap kali Next.js reload (Hot Reload)
const globalForDb = global as unknown as { conn: postgres.Sql | undefined };

const connectionString = process.env.DATABASE_URL!;
const client = globalForDb.conn ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== 'production') globalForDb.conn = client;

export const db = drizzle(client, { schema });