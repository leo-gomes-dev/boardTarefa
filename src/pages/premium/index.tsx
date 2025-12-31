import { useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
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
    if (!session) {
      toast.info("Faça login para concluir sua assinatura.", {
        position: "top-center",
        theme: "dark",
      });
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
      toast.error("Erro ao iniciar checkout.", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Planos 2026 - OrganizaTask</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>Turbine seus estudos em 2026</h1>
          <p>O empurrão que faltava para sua organização acadêmica.</p>
        </section>

        <div className={styles.plansArea}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>FREE</span>
              <h2>Basic Starter</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>{configs.basicValor}</span>
              </div>
              <p className={styles.totalPrice}>{configs.basicDesc}</p>
            </div>
            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> 10 tarefas ativas
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Histórico de 7 dias
              </li>
            </ul>
            <button
              disabled
              className={`${styles.buyButton} ${styles.outline}`}
            >
              PLANO ATUAL
            </button>
          </div>

          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS VENDIDO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>12 MESES</span>
              <h2>Premium Plus</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>{configs.anualValor}</span>
              </div>
              <p className={styles.totalPrice}>{configs.anualDesc}</p>
            </div>
            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> <FaInfinity /> Tarefas
                ilimitadas
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte Prioritário
              </li>
            </ul>
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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>36 MESES</span>
              <h2>Student Pro</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>{configs.trienalValor}</span>
              </div>
              <p className={styles.totalPrice}>{configs.trienalDesc}</p>
            </div>
            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tudo do Plano Anual
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> 1 ano grátis (Economia)
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte via WhatsApp
              </li>
            </ul>
            <button
              onClick={() =>
                handleCheckout("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "CARREGANDO..." : "ECONOMIZAR AGORA"}
            </button>
          </div>
        </div>
      </main>
      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const adminEmail = "leogomdesenvolvimento@gmail.com";
  const docRef = doc(db, "users", adminEmail);
  const docSnap = await getDoc(docRef);
  let configs = {
    basicValor: "0,00",
    basicDesc: "Grátis para sempre",
    anualValor: "118,80",
    anualDesc: "R$ 9,90 por mês",
    trienalValor: "284,40",
    trienalDesc: "R$ 7,90 por mês (Melhor preço)",
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
