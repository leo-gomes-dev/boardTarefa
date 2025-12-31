import styles from "./styles.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isOnAdminPage = router.pathname === "/admin";
  const isDashboardPage = router.pathname === "/dashboard";

  // NOVA CONSTANTE: Verifica se está na página de oferta ou checkout
  const isSalesPage =
    router.pathname === "/premium" || router.pathname === "/pagamento";

  // Lista de e-mails permitidos para acesso à página admin
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

          {/* SÓ MOSTRA O LINK PAINEL SE:
              1. Tiver sessão
              2. NÃO estiver na Dashboard
              3. NÃO estiver em páginas de venda (Premium/Pagamento) 
          */}
          {session?.user && !isDashboardPage && !isSalesPage && (
            <Link href="/dashboard" className={styles.link}>
              Painel
            </Link>
          )}

          {/* SÓ MOSTRA O LINK ADMIN SE:
              1. NÃO estiver na página Admin
              2. For um usuário Admin
              3. NÃO estiver em páginas de venda (Premium/Pagamento)
          */}
          {!isOnAdminPage && isAdminUser && !isSalesPage && (
            <Link href="/admin" className={styles.link}>
              Admin
            </Link>
          )}
        </nav>

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
