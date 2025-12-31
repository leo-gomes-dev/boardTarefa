import styles from "./styles.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  // Constantes de Verificação de Rota
  const isHomePage = router.pathname === "/";
  const isSalesPage = router.pathname === "/premium";
  const isOnAdminPage = router.pathname === "/admin";
  const isDashboardPage = router.pathname === "/dashboard";

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

          {/* Link Painel: Mostra se logado, exceto se já estiver no Dashboard ou no Premium */}
          {session?.user && !isDashboardPage && !isSalesPage && (
            <Link href="/dashboard" className={styles.link}>
              Painel
            </Link>
          )}

          {/* Link Admin: Mostra se for admin e não estiver na página de vendas */}
          {!isOnAdminPage && isAdminUser && !isSalesPage && (
            <Link href="/admin" className={styles.link}>
              Admin
            </Link>
          )}
        </nav>

        {/* 
            LÓGICA DE LOGIN 2026: 
            O botão de login é OCULTADO na Home e na página Premium para usuários deslogados,
            pois estas páginas já possuem botões centrais de ação.
            Se o usuário já estiver logado, o botão sempre aparece para permitir o Logout.
        */}
        {((!isHomePage && !isSalesPage) || session) && (
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
