import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "../../../services/firebaseConnection";
import { doc, getDoc } from "firebase/firestore";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    // 1. JWT: Executado quando o token é criado ou atualizado
    // Buscamos o plano no Firestore uma vez e guardamos no Token
    async jwt({ token, user }: any) {
      if (user) {
        try {
          const userRef = doc(db, "users", user.email);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            token.plan = userSnap.data().plano || "Free";
          } else {
            token.plan = "Free";
          }
        } catch (error) {
          token.plan = "Free";
        }
      }
      return token;
    },

    // 2. SESSION: Repassa a informação do Token para o Front-end
    async session({ session, token }: any) {
      try {
        return {
          ...session,
          id: token.sub,
          user: {
            ...session.user,
            plan: token.plan, // Aqui o Footer conseguirá ler: session.user.plan
          },
        };
      } catch {
        return {
          ...session,
          id: null,
        };
      }
    },

    async signIn({ user }: any) {
      try {
        return true;
      } catch (err) {
        console.log("ERRO NO SIGNIN: ", err);
        return false;
      }
    },
  },
  secret: process.env.JWT_SECRET as string,
};

export default NextAuth(authOptions);
