import { useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import styles from "./styles.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Firebase
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
      toast.info("Quase lá! Faça login para concluir sua assinatura.", {
        position: "top-center",
        autoClose: 3000,
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
          plano: plano,
          valor: valor.replace(",", "."),
          email: session.user?.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erro ao gerar link de pagamento");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao iniciar checkout.", {
        theme: "dark",
      });
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
          <h1>Escolha o plano ideal para sua produtividade</h1>
          <p>Soluções escalonáveis para seus projetos em 2026.</p>
        </section>

        <div className={styles.plansArea}>
          {/* PLANO BASIC */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>INDIVIDUAL</span>
              <h2>Basic Starter</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>{configs.basicValor}</span>
              </div>
              <p className={styles.totalPrice}>{configs.basicDesc}</p>
            </div>

            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Até 10 tarefas ativas
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Histórico de 7 dias
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte via Comunidade
              </li>
            </ul>

            <button
              onClick={() =>
                handleCheckout("Basic Starter", configs.basicValor)
              }
              disabled={loading || configs.basicValor === "0,00"}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {configs.basicValor === "0,00" ? "PLANO ATUAL" : "ASSINAR AGORA"}
            </button>
          </div>

          {/* PLANO ANUAL - RECOMENDADO */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS POPULAR</div>
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
              <li>
                <FaCheckCircle color="#2ecc71" /> Dashboard de Performance
              </li>
            </ul>

            <button
              onClick={() =>
                handleCheckout("Premium Anual", configs.anualValor)
              }
              disabled={loading}
              className={styles.buyButton}
            >
              {loading ? "PROCESSANDO..." : "COMEÇAR AGORA"}
            </button>
          </div>

          {/* PLANO 36 MESES (TRIENAL) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>36 MESES (TRIENAL)</span>
              <h2>Enterprise Gold</h2>
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
                <FaCheckCircle color="#2ecc71" /> Suporte 24/7 via WhatsApp
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Backup em Nuvem Própria
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Menor preço por mês
              </li>
            </ul>

            <button
              onClick={() =>
                handleCheckout("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "PROCESSANDO..." : "OBTER DESCONTO TRIENAL"}
            </button>
          </div>
        </div>

        <div className={styles.secure}>
          <FaShieldAlt size={14} />
          <span>Pagamento 100% Seguro via Mercado Pago</span>
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
    basicDesc: "Grátis para iniciantes",
    anualValor: "118,80",
    anualDesc: "Equivalente a R$ 9,90/mês",
    trienalValor: "297,00",
    trienalDesc: "Economia máxima por 3 anos",
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
