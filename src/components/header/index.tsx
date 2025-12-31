import styles from "./styles.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  // Verificação de Rotas
  const isHomePage = router.pathname === "/";
  const isSalesPage = router.pathname === "/premium";
  const isSignInPage = router.pathname === "/signin";

  const isOnAdminPage = router.pathname === "/admin";
  const isDashboardPage = router.pathname === "/dashboard";

  const allowedAdminEmails = [
    "leogomdesenvolvimento@gmail.com",
    "leogomecommerce@gmail.com",
  ];

  const isAdminUser =
    session?.user?.email && allowedAdminEmails.includes(session.user.email);

  return (
    <header className={styles.header}>
      <section className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/">
            <h1 className={styles.logo}>Tasks</h1>
          </Link>

          {/* O BOTÃO 'PAINEL' FOI REMOVIDO DAQUI */}

          {!isOnAdminPage && isAdminUser && !isSalesPage && (
            <Link href="/admin" className={styles.link}>
              Admin
            </Link>
          )}
        </nav>

        {/* 
            LÓGICA UX 2026: 
            Ocultamos o botão nas páginas de entrada (Home, Premium e Login) quando deslogado.
            Se o usuário estiver logado, o botão de perfil/sair sempre aparece.
        */}
        {((!isHomePage && !isSalesPage && !isSignInPage) || session) && (
          <button
            className={styles.loginButton}
            onClick={() => (session ? signOut() : signIn("google"))}
          >
            {session ? `Olá ${session?.user?.name?.split(" ")[0]}` : "Acessar"}
          </button>
        )}
      </section>
    </header>
  );
}
