import { useState } from "react";
import Head from "next/head";
import { useSession, signIn } from "next-auth/react"; // Adicionado signIn
import { GetServerSideProps } from "next";
import styles from "./styles.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc } from "firebase/firestore";
import {
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaInfinity,
  FaStar,
  FaCrown,
  FaUser,
} from "react-icons/fa";

interface PremiumProps {
  configs: {
    basicValor: string;
    basicDesc: string;
    anualValor: string;
    anualDesc: string;
    trienalValor: string;
    trienalDesc: string;
  };
}

export default function Premium({ configs }: PremiumProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleCheckout(plano: string, valor: string) {
    // Lógica UX: Se não está logado, abre o provedor de login (Google/GitHub etc)
    if (!session) {
      toast.info("Identificamos que você não está logado. Redirecionando...", {
        theme: "dark",
      });
      setTimeout(() => {
        signIn(); // Abre a página de login do NextAuth
      }, 1500);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano,
          valor: valor.replace(",", "."),
          email: session.user?.email,
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error();
    } catch {
      toast.error("Erro ao processar. Tente novamente.", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Planos e Acesso - OrganizaTask</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>
            {session
              ? `Olá, ${session.user?.name}!`
              : "Escolha seu plano para continuar"}
          </h1>
          <p>Selecione a melhor opção para organizar seus projetos hoje.</p>
        </section>

        <div className={styles.plansArea}>
          {/* CARD BASIC */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>INDIVIDUAL</span>
              <h2>Free Starter</h2>
              <div className={styles.price}>R$ {configs.basicValor}</div>
              <p>{configs.basicDesc}</p>
            </div>
            <button
              onClick={() =>
                handleCheckout("Basic Starter", configs.basicValor)
              }
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {session ? "ACESSAR VERSÃO FREE" : "LOGAR E ACESSAR"}
            </button>
          </div>

          {/* CARD ANUAL */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS RECOMENDADO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>PREMIUM</span>
              <h2>Premium Plus</h2>
              <div className={styles.price}>R$ {configs.anualValor}</div>
              <p>{configs.anualDesc}</p>
            </div>
            <button
              onClick={() =>
                handleCheckout("Premium Anual", configs.anualValor)
              }
              disabled={loading}
              className={styles.buyButton}
            >
              {loading ? "CARREGANDO..." : "ASSINAR AGORA"}
            </button>
          </div>

          {/* CARD TRIENAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>PROFISSIONAL</span>
              <h2>Professional Max</h2>
              <div className={styles.price}>R$ {configs.trienalValor}</div>
              <p>{configs.trienalDesc}</p>
            </div>
            <button
              onClick={() =>
                handleCheckout("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "CARREGANDO..." : "OBTER ACESSO MAX"}
            </button>
          </div>
        </div>
      </main>
      <ToastContainer theme="dark" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const adminEmail = "leogomdesenvolvimento@gmail.com";
  const docRef = doc(db, "users", adminEmail);
  const docSnap = await getDoc(docRef);

  let configs = {
    basicValor: "0,00",
    basicDesc: "Essencial para começar",
    anualValor: "118,80",
    anualDesc: "R$ 9,90 por mês",
    trienalValor: "284,40",
    trienalDesc: "R$ 7,90 por mês",
  };

  if (docSnap.exists()) {
    const data = docSnap.data();
    configs = {
      basicValor: data.planoBasicValor || configs.basicValor,
      basicDesc: data.planoBasicDescricao || configs.basicDesc,
      anualValor: data.planoAnualValor || configs.anualValor,
      anualDesc: data.planoAnualDescricao || configs.anualDesc,
      trienalValor: data.planoTrienalValor || configs.trienalValor,
      trienalDesc: data.planoTrienalDescricao || configs.trienalDesc,
    };
  }

  return { props: { configs } };
};
