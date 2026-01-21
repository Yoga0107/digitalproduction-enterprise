import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/user.repository";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_SIGN_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SIGN_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await getUserByEmail(user.email);

      if (!existingUser) {
        await createUser({
          name: user.name ?? "",
          email: user.email,
          role: "officer",
        });
      }

      return true;
    },

    async jwt({ token }) {
      if (!token.email) return token;

      const dbUser = await getUserByEmail(token.email);

      token.role = (dbUser?.role ?? "officer") as "officer" | "viewer";

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "officer" | "viewer";
      }
      return session;
    },
  },
};
