import styles from "./styles.module.css";
import { Github, Instagram, Globe, Mail } from "lucide-react";
import { useSession } from "next-auth/react";

export function Footer() {
  const { data: session } = useSession();

  // Lógica de produção: verifica se existe sessão E se o plano é explicitamente um dos pagos.
  // Isso evita que o link apareça caso o plano venha como undefined ou vazio.
  const userPlan = (session?.user as any)?.plan;
  const isPaidUser =
    session?.user &&
    userPlan !== "Free" &&
    userPlan !== undefined &&
    userPlan !== null;

  return (
    <footer className={styles.footer}>
      <section className={styles.content}>
        <div className={styles.brand}>
          <p>
            © 2026 <strong>By Leo Gomes Developer</strong>
          </p>
        </div>

        <nav className={styles.socialNav}>
          {/* Suporte visível apenas para usuários Premium, Enterprise ou Max */}
          {isPaidUser && (
            <a
              href="mailto:suporte@leogomesdev.com"
              className={styles.socialLink}
              title="Suporte Exclusivo"
              style={{
                color: "#3183ff",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginRight: "15px",
              }}
            >
              <Mail size={20} />
              <span style={{ fontSize: "14px" }}>Suporte</span>
            </a>
          )}

          <a
            href="https://leogomesdev.com"
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
