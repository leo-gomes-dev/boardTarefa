import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link"; // Importado para navegação interna
import { getSession, useSession } from "next-auth/react";
import styles from "../../styles/home.module.css";
import Image from "next/image";
import tarefaImg from "../../public/assets/tarefas.png";
import { db } from "../services/firebaseConnection";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

interface HomeProps {
  posts: number;
  comments: number;
  userPlan?: string;
}

export default function Home({ posts, comments, userPlan }: HomeProps) {
  const { data: session } = useSession();

  // UX 2026: Controle visual baseado no plano
  const hasFullPlan =
    userPlan === "Enterprise 36 Meses" || userPlan === "Professional Max";

  return (
    <div className={styles.container}>
      <Head>
        <title>OrganizaTask 2026 | Gestão Inteligente</title>
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

        <div className={styles.ctaArea}>
          {/* 
            LÓGICA PARA PRODUÇÃO:
            1. Se NÃO logado: Direciona para a SUA página de login personalizada.
            2. Se logado e Plano Full: Mostra selo de acesso total.
            3. Se logado e Plano Basic: Botão leva direto para o Dashboard.
          */}
          {!session ? (
            <Link href="/signin">
              <button className={styles.buttonAcessar}>ACESSAR</button>
            </Link>
          ) : hasFullPlan ? (
            <div className={styles.activePlanBadge}>
              VOCÊ JÁ POSSUI ACESSO ILIMITADO PROFISSIONAL
            </div>
          ) : (
            <Link href="/dashboard">
              <button className={styles.buttonAcessar}>
                IR PARA MEU PAINEL
              </button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  let userPlan = "";

  if (session?.user?.email) {
    const userRef = doc(db, "users", session.user.email);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      userPlan = userSnap.data().plano || "";
    }
  }

  try {
    const commentRef = collection(db, "comments");
    const postRef = collection(db, "tarefas");
    const commentSnapshot = await getDocs(commentRef);
    const postSnapshot = await getDocs(postRef);

    return {
      props: {
        posts: postSnapshot.size || 0,
        comments: commentSnapshot.size || 0,
        userPlan,
      },
    };
  } catch (error) {
    return { props: { posts: 0, comments: 0, userPlan } };
  }
};
