import Head from "next/head";
import { signIn } from "next-auth/react";
import styles from "./styles.module.css";
import { FaGoogle, FaRocket } from "react-icons/fa";

export default function SignIn() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Acessar conta | OrganizaTask</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <FaRocket size={40} color="#3183ff" />
            <h1>Sua produtividade começa aqui</h1>
            <p>
              Faça login para gerenciar suas tarefas e projetos de forma
              profissional.
            </p>
          </div>

          <div className={styles.buttonArea}>
            <button
              className={styles.googleButton}
              onClick={() => signIn("google", { callbackUrl: "/premium" })}
            >
              <FaGoogle size={20} />
              Continuar com Google
            </button>
          </div>

          <p className={styles.footerText}>
            Ambiente seguro e autenticado via Google Accounts.
          </p>
        </div>
      </main>
    </div>
  );
}
