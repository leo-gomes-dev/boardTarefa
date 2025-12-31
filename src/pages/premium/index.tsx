import { useState } from "react";
import Head from "next/head";
import { useSession, signIn } from "next-auth/react";
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
import { useRouter } from "next/router";

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
  const router = useRouter();

  async function handleCheckout(plano: string, valor: string) {
    // 1. LÓGICA PARA USUÁRIO DESLOGADO
    if (!session) {
      toast.info("Faça login para continuar com sua assinatura.", {
        theme: "dark",
      });

      // O segredo está aqui: salvamos o callbackUrl para ele voltar para cá após o login
      setTimeout(() => {
        signIn("google", { callbackUrl: "/premium" });
      }, 1000);
      return;
    }

    // 2. LÓGICA PARA PLANO FREE (LOGADO)
    if (plano === "Basic Free") {
      router.push("/dashboard");
      return;
    }

    // 3. LÓGICA MERCADO PAGO (LOGADO)
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
      if (data.url) {
        window.location.href = data.url; // Redireciona para o Mercado Pago
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro ao gerar pagamento. Tente novamente.", {
        theme: "dark",
      });
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
            {session ? `Olá, ${session.user?.name}!` : "Escolha seu plano"}
          </h1>
          <p>O primeiro passo para uma rotina de alta performance em 2026.</p>
        </section>

        <div className={styles.plansArea}>
          {/* FREE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>INDIVIDUAL</span>
              <h2>Free Starter</h2>
              <div className={styles.price}>R$ {configs.basicValor}</div>
              <p>{configs.basicDesc}</p>
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
              onClick={() => handleCheckout("Basic Free", configs.basicValor)}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {session ? "ACESSAR AGORA" : "LOGAR PARA ACESSAR"}
            </button>
          </div>

          {/* ANUAL */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS RECOMENDADO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>PREMIUM</span>
              <h2>Premium Plus</h2>
              <div className={styles.price}>R$ {configs.anualValor}</div>
              <p>{configs.anualDesc}</p>
            </div>
            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tarefas ilimitadas
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
              {loading ? "PROCESSANDO..." : "ASSINAR AGORA"}
            </button>
          </div>

          {/* TRIENAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>PROFISSIONAL</span>
              <h2>Professional Max</h2>
              <div className={styles.price}>R$ {configs.trienalValor}</div>
              <p>{configs.trienalDesc}</p>
            </div>
            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tudo do Anual
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte VIP WhatsApp
              </li>
            </ul>
            <button
              onClick={() =>
                handleCheckout("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "PROCESSANDO..." : "GARANTIR ACESSO MAX"}
            </button>
          </div>
        </div>

        <div className={styles.secure}>
          <FaShieldAlt size={14} />
          <span>Checkout Seguro via Mercado Pago</span>
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
    anualDesc: "Apenas R$ 9,90 por mês",
    trienalValor: "284,40",
    trienalDesc: "Apenas R$ 7,90 por mês",
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
