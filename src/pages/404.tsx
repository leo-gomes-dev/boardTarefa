import Head from "next/head";
import Link from "next/link";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import styles from "./404.module.css";

export default function Custom404() {
  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>Página não encontrada | OrganizaTask 2026</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.content}>
          <h1>404</h1>
          <h2>Página não encontrada</h2>
          <p>
            Ops! Parece que a página que você está procurando não existe ou foi
            removida.
          </p>
          <Link href="/">
            <button className={styles.button}>Voltar para Home</button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
