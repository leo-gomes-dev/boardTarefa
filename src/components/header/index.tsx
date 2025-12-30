import styles from "./styles.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isOnAdminPage = router.pathname === "/admin"; // Verificar se a página é "/admin"
  const isDashboardPage = router.pathname === "/dashboard"; // Verificar se a página é "/dashboard"

  // Lista de e-mails permitidos para acesso à página admin
  const allowedAdminEmails = [
    "leogomdesenvolvimento@gmail.com",
    "leogomesdeveloper@gmail.com",
    "leogomecommerce@gmail.com",
  ];

  // Verificar se o usuário está logado e se o e-mail está na lista
  const isAdminUser =
    session?.user?.email && allowedAdminEmails.includes(session.user.email);

  return (
    <header className={styles.header}>
      <section className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/">
            <h1 className={styles.logo}>Tasks</h1>
          </Link>
          {session?.user && (
            <Link href="/dashboard" className={styles.link}>
              Painel
            </Link>
          )}

          {/* Verificar se o usuário está na lista de e-mails permitidos para exibir o link "Admin" */}
          {!isOnAdminPage && isAdminUser && (
            <Link href="/admin" className={styles.link}>
              Admin
            </Link>
          )}
        </nav>

        {/* <span className={styles.loginButton}>
          {" "}
          {status === "loading" ? "Carregando..." : <></>}
        </span> */}

        <button
          className={styles.loginButton}
          onClick={() => (session ? signOut() : signIn("google"))}
        >
          {session ? `Olá ${session?.user?.name}` : "Acessar"}
        </button>
      </section>
    </header>
  );
}
