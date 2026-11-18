import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/model/user-model";
import { dbConnect } from "@/lib/mongo";
import { credentialsSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  trustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.NODE_ENV !== "production",
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          await dbConnect();
          await rateLimit("login:" + parsed.data.username.toLowerCase(), 10, 15 * 60_000);
          const user = await User.findOne({ username: parsed.data.username }).select("+password");
          if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) return null;
          return { id: user._id.toString(), name: user.username, email: user.email };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.sub;
      return session;
    },
    redirect({ url, baseUrl }) {
      const destination = new URL(url, baseUrl);
      return destination.origin === new URL(baseUrl).origin ? destination.href : baseUrl;
    },
  },
});
