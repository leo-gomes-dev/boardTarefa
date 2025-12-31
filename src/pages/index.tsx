import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link"; // Importação necessária
import styles from "../../styles/home.module.css";
import Image from "next/image";
import tarefaImg from "../../public/assets/tarefas.png";
import { db } from "../services/firebaseConnection";
import { collection, getDocs } from "firebase/firestore";

interface HomeProps {
  posts: number;
  comments: number;
}

export default function Home({ posts, comments }: HomeProps) {
  return (
    <div className={styles.container}>
      <Head>
        <title>OrganizaTask 2026 | Domine sua Rotina</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContent}>
          <Image
            className={styles.hero}
            alt="Logo Tarefas+"
            src={tarefaImg}
            priority
          />
        </div>
        <h1 className={styles.title}>
          Simples, direto e organizado.
          <br />
          "Domine o seu dia, uma tarefa por vez."
        </h1>

        {/* BOTÃO DE ACESSO - UX: O destaque principal da página */}
        <div className={styles.ctaArea}>
          <Link href="/premium">
            <button className={styles.buttonAcessar}>
              ACESSAR MINHAS TAREFAS
            </button>
          </Link>
        </div>

        <div className={styles.infoContent}>
          <section className={styles.box}>
            <span>+{posts} tarefas criadas</span>
          </section>
          <section className={styles.box}>
            <span>+{comments} feedbacks</span>
          </section>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const commentRef = collection(db, "comments");
    const postRef = collection(db, "tarefas");
    const commentSnapshot = await getDocs(commentRef);
    const postSnapshot = await getDocs(postRef);

    return {
      props: {
        posts: postSnapshot.size || 0,
        comments: commentSnapshot.size || 0,
      },
    };
  } catch (error) {
    return { props: { posts: 0, comments: 0 } };
  }
};
