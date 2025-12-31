import styles from "./styles.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isHomePage = router.pathname === "/"; // Identifica a Home
  const isOnAdminPage = router.pathname === "/admin";
  const isDashboardPage = router.pathname === "/dashboard";

  const isSalesPage =
    router.pathname === "/premium" || router.pathname === "/pagamento";

  const allowedAdminEmails = [
    "leogomdesenvolvimento@gmail.com",
    "leogomesdeveloper@gmail.com",
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

          {session?.user && !isDashboardPage && !isSalesPage && (
            <Link href="/dashboard" className={styles.link}>
              Painel
            </Link>
          )}

          {!isOnAdminPage && isAdminUser && !isSalesPage && (
            <Link href="/admin" className={styles.link}>
              Admin
            </Link>
          )}
        </nav>

        {/* 
            LÓGICA DE UX 2026: 
            O botão só aparece se NÃO estiver na Home OU se o usuário já estiver logado.
            Se estiver na Home e deslogado, ele usa o botão central da página para entrar.
        */}
        {(!isHomePage || session) && (
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
