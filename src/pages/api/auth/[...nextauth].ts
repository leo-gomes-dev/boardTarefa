import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // UX 2026: Aponta para a sua página de login personalizada
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    // Adiciona o ID do usuário na sessão para facilitar consultas no Firestore
    async session({ session, token }: any) {
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
    // Executado no momento do login
    async signIn({ user, account, profile }: any) {
      const { email } = user;
      try {
        // Você pode adicionar lógicas de bloqueio aqui se necessário
        return true;
      } catch (err) {
        console.log("ERRO NO SIGNIN: ", err);
        return false;
      }
    },
  },
  // Chave de criptografia das sessões
  secret: process.env.JWT_SECRET as string,
};

export default NextAuth(authOptions);
