import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, getUserByGoogleId, upsertGoogleUser, upsertTelegramUser, touchLastLoggedIn } from "@/shared/lib/auth-db";
import { verifyTelegramHash, isTelegramAuthFresh } from "@/shared/lib/telegram";

const ACCESS_TOKEN_TTL = 60 * 60 * 1000;          // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = (credentials.email as string).trim().toLowerCase();
        const user = await getUserByEmail(email);
        if (!user || !user.password_hash) return null;
        const ok = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!ok) return null;
        return {
          id: String(user.id),
          email: user.email!,
          name: user.name ?? user.email!,
        };
      },
    }),

    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: {},
        first_name: {},
        last_name: {},
        username: {},
        photo_url: {},
        auth_date: {},
        hash: {},
      },
      async authorize(credentials) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken || botToken === "REPLACE_WITH_TELEGRAM_BOT_TOKEN") return null;

        // NextAuth injects csrfToken and callbackUrl — strip them before hash verification
        const TELEGRAM_FIELDS = new Set(["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"]);
        const data = Object.fromEntries(
          Object.entries(credentials as Record<string, string>).filter(([k]) => TELEGRAM_FIELDS.has(k))
        ) as Record<string, string>;

        if (!verifyTelegramHash(data, botToken)) return null;
        if (!isTelegramAuthFresh(data.auth_date)) return null;

        const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
        const userId = await upsertTelegramUser(data.id, name, data.photo_url || undefined);
        return {
          id: String(userId),
          name,
          image: data.photo_url || null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile) {
        const googleId = account.providerAccountId;
        const email = profile.email ?? null;
        const name = (profile.name as string | undefined) ?? "";
        const image = (profile.picture as string | undefined) ?? "";
        await upsertGoogleUser(googleId, email ?? null, name, image);
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // Initial sign-in: resolve our internal DB id
        if (account?.provider === "google") {
          const dbUser = await getUserByGoogleId(account.providerAccountId);
          token.userId = dbUser ? String(dbUser.id) : undefined;
        } else {
          // Credentials providers return our DB id directly from authorize()
          token.userId = user.id;
        }
        // Persist profile data so it survives token refreshes
        token.picture = token.picture ?? user.image ?? null;
        token.name    = token.name   ?? user.name  ?? null;
        token.accessTokenExpires  = Date.now() + ACCESS_TOKEN_TTL;
        token.refreshTokenExpires = Date.now() + REFRESH_TOKEN_TTL;
        if (token.userId) {
          await touchLastLoggedIn(parseInt(token.userId as string, 10));
        }
        return token;
      }

      const now = Date.now();
      if (now < (token.accessTokenExpires as number)) return token;
      if (now > (token.refreshTokenExpires as number)) {
        // Refresh token expired — invalidate session
        return null;
      }

      // Rotate access token
      return { ...token, accessTokenExpires: now + ACCESS_TOKEN_TTL };
    },

    session({ session, token }) {
      if (token.userId)  session.user.id    = token.userId  as string;
      if (token.picture) session.user.image = token.picture as string;
      if (token.name)    session.user.name  = token.name    as string;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
});
