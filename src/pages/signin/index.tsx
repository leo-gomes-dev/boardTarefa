import Head from "next/head";
import { signIn } from "next-auth/react";
import styles from "./styles.module.css";
import { FaGoogle, FaGithub, FaRocket } from "react-icons/fa";

export default function SignIn() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Login | OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <FaRocket size={40} color="#3183ff" />
            <h1>Bem-vindo de volta</h1>
            <p>Escolha uma forma de acessar sua conta e organizar seu dia.</p>
          </div>

          <div className={styles.buttonArea}>
            <button
              className={styles.googleButton}
              onClick={() => signIn("google", { callbackUrl: "/premium" })}
            >
              <FaGoogle size={20} />
              Entrar com Google
            </button>

            <button
              className={styles.githubButton}
              onClick={() => signIn("github", { callbackUrl: "/premium" })}
            >
              <FaGithub size={20} />
              Entrar com GitHub
            </button>
          </div>

          <p className={styles.footerText}>
            Ao entrar, você concorda com nossos <br />
            <span>Termos de Uso</span> e <span>Privacidade</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
