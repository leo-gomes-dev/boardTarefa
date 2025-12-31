import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { Github, Instagram, Globe } from "lucide-react"; // Trocado para Instagram

export function Footer() {
  const router = useRouter();

  return (
    <footer className={styles.footer}>
      <section className={styles.content}>
        <div className={styles.brand}>
          <p>
            © 2026 <strong>By Leo Gomes Developer</strong>
          </p>
        </div>
        <nav className={styles.socialNav}>
          <a
            href="https://leogomesdev.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            title="Website"
          >
            <Globe size={20} />
          </a>

          <a
            href="https://github.com/leo-gomes-dev"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            title="GitHub"
          >
            <Github size={20} />
          </a>

          <a
            href="https://www.instagram.com/leogomes_dev"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            title="Instagram"
          >
            <Instagram size={20} />
          </a>
        </nav>
      </section>
    </footer>
  );
}
("");
