import styles from "./styles.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

export function Footer() {
  const router = useRouter();

  // Verifica se está em páginas onde você talvez queira esconder o rodapé ou simplificá-lo
  const isSalesPage =
    router.pathname === "/premium" || router.pathname === "/pagamento";

  return (
    <footer className={styles.footer}>
      <section className={styles.content}>
        <div className={styles.brand}>
          <p>
            © 2026 <strong>By Leo Gomes Developer</strong>
          </p>
        </div>

        <nav className={styles.nav}>
          <Link href="/" className={styles.link}>
            Home
          </Link>

          {!isSalesPage && (
            <>
              <Link href="/dashboard" className={styles.link}>
                Tarefas
              </Link>
              <a
                href="github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                GitHub
              </a>
            </>
          )}
        </nav>
      </section>
    </footer>
  );
}
