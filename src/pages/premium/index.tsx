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

  async function handleAction(plano: string, valor: string) {
    // SE NÃO ESTIVER LOGADO: Força login e volta para esta página
    if (!session) {
      signIn("google", { callbackUrl: "/premium" });
      return;
    }

    // SE ESTIVER LOGADO E ESCOLHER O FREE: Vai para Dashboard
    if (plano === "Basic Free") {
      router.push("/dashboard");
      return;
    }

    // SE ESTIVER LOGADO E ESCOLHER PLANO PAGO: Vai para Mercado Pago
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
        window.location.href = data.url;
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro ao processar pagamento.", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Planos OrganizaTask 2026</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>
            {session ? `Quase lá, ${session.user?.name}!` : "Escolha seu plano"}
          </h1>
          <p>Selecione como deseja organizar seus projetos em 2026.</p>
        </section>

        <div className={styles.plansArea}>
          {/* PLANO FREE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>INDIVIDUAL</span>
              <h2>Free Starter</h2>
              <div className={styles.price}>R$ {configs.basicValor}</div>
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
              onClick={() => handleAction("Basic Free", configs.basicValor)}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {session ? "ACESSAR DASHBOARD" : "LOGAR E ACESSAR"}
            </button>
          </div>

          {/* PLANO ANUAL */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS RECOMENDADO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>PREMIUM</span>
              <h2>Premium Plus</h2>
              <div className={styles.price}>R$ {configs.anualValor}</div>
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
              onClick={() => handleAction("Premium Anual", configs.anualValor)}
              disabled={loading}
              className={styles.buyButton}
            >
              {loading ? "GERANDO TICKET..." : "ASSINAR AGORA"}
            </button>
          </div>

          {/* PLANO TRIENAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>PROFISSIONAL</span>
              <h2>Professional Max</h2>
              <div className={styles.price}>R$ {configs.trienalValor}</div>
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
                handleAction("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "GERANDO TICKET..." : "GARANTIR ACESSO MAX"}
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
