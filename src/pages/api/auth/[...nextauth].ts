import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // Adicionamos a configuração de páginas customizadas aqui
  pages: {
    signIn: "/signin", // Caminho da página bonita que você criou
  },
  callbacks: {
    async session({ session, token, user }: any) {
      try {
        return {
          ...session,
          id: token.sub,
        };
      } catch {
        return {
          ...session,
          id: null,
        };
      }
    },
    async signIn({ user, account, profile }: any) {
      const { email } = user;
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
