import { GetServerSideProps } from "next"; // Alterado de Static para ServerSide
import Head from "next/head";
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
        <title>Leo Gomes | Organizador de tarefas</title>
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

        {/* <div className={styles.infoContent}>
          <section className={styles.box}>
            <span>+{posts} posts</span>
          </section>
          <section className={styles.box}>
            <span>+{comments} comentários</span>
          </section>
        </div> */}
      </main>
    </div>
  );
}

// Alterado para getServerSideProps para evitar erro de permissão no build
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
    console.error("Erro ao buscar dados do Firebase:", error);
    return {
      props: {
        posts: 0,
        comments: 0,
      },
    };
  }
};
