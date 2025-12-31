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
} from "react-icons/fa";

interface PremiumProps {
  configs: {
    anualValor: string;
    anualDesc: string;
    vitalicioValor: string;
    vitalicioDesc: string;
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
          valor: valor.replace(",", "."), // Garante formato numérico para a API
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
        <title>Upgrade Premium - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>Eleve sua produtividade ao próximo nível</h1>
          <p>Escolha o plano ideal para sua rotina em 2026.</p>
        </section>

        <div className={styles.plansArea}>
          {/* PLANO ANUAL DINÂMICO */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS VENDIDO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>PLANO ANUAL</span>
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
                <FaCheckCircle color="#2ecc71" /> Suporte prioritário
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tarefas públicas e
                compartilháveis
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("Premium Plus", configs.anualValor)}
              disabled={loading}
              className={styles.buyButton}
            >
              {loading ? "CARREGANDO..." : "ASSINAR AGORA"}
            </button>
          </div>

          {/* PLANO VITALÍCIO DINÂMICO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>PACOTE 36 MESES</span>
              <h2>Enterprise</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>{configs.vitalicioValor}</span>
              </div>
              <p className={styles.totalPrice}>{configs.vitalicioDesc}</p>
            </div>

            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tudo do Plano Anual
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte prioritário 24/7
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Mentoria de produtividade
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Exportação de relatórios
              </li>
            </ul>

            <button
              onClick={() =>
                handleCheckout("Enterprise Vitalício", configs.vitalicioValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {loading ? "CARREGANDO..." : "ADQUIRIR VITALÍCIO"}
            </button>
          </div>
        </div>

        <div className={styles.secure}>
          <FaShieldAlt size={14} />
          <span>Pagamento processado com segurança pelo Mercado Pago</span>
        </div>
      </main>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // Buscamos as configurações do e-mail do admin que detém as definições de preço
  const adminEmail = "leogomdesenvolvimento@gmail.com";
  const docRef = doc(db, "users", adminEmail);
  const docSnap = await getDoc(docRef);

  let configs = {
    anualValor: "118,80",
    anualDesc: "R$ 118,80 cobrados anualmente",
    vitalicioValor: "297,00",
    vitalicioDesc: "Acesso vitalício sem mensalidade",
  };

  if (docSnap.exists()) {
    const data = docSnap.data();
    configs = {
      anualValor: data.planoAnualValor || configs.anualValor,
      anualDesc: data.planoAnualDescricao || configs.anualDesc,
      vitalicioValor: data.planoVitalicioValor || configs.vitalicioValor,
      vitalicioDesc: data.planoVitalicioDescricao || configs.vitalicioDesc,
    };
  }

  return {
    props: {
      configs,
    },
  };
};
