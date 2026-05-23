import type { NextAuthOptions } from "next-auth";
import db from "@repo/db/client";
import {
  blockSessionToken,
  cacheUserSession,
  invalidateUserSession,
  isSessionTokenBlocked,
} from "@repo/redis";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: {
          label: "Phone number",
          type: "text",
          placeholder: "1231231231",
          required: true,
        },
        password: { label: "Password", type: "password", required: true },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        const existingUser = await db.user.findFirst({
          where: { number: credentials.phone },
        });

        if (existingUser) {
          const passwordValidation = await bcrypt.compare(
            credentials.password,
            existingUser.password
          );
          if (passwordValidation) {
            return {
              id: existingUser.id.toString(),
              name: existingUser.name,
              email: existingUser.number,
            };
          }
          return null;
        }

        const hashedPassword = await bcrypt.hash(credentials.password, 10);
        try {
          const user = await db.user.create({
            data: {
              number: credentials.phone,
              password: hashedPassword,
            },
          });

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.number,
          };
        } catch (e) {
          console.error(e);
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "secret",
  events: {
    async signIn({ user }) {
      if (user.id) {
        await cacheUserSession(user.id, {
          userId: user.id,
          name: user.name,
          email: user.email,
        });
      }
    },
    async signOut({ token }) {
      if (token?.sub) {
        await invalidateUserSession(token.sub);
        await blockSessionToken(token.sub);
      }
    },
  },
  callbacks: {
    async jwt({ token }) {
      if (token.sub && (await isSessionTokenBlocked(token.sub))) {
        return { ...token, blocked: true };
      }
      return token;
    },
    async session({ token, session }) {
      if (token.blocked || !token.sub) {
        return session;
      }
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
