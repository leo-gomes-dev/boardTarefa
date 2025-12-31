import { useState } from "react";
import Head from "next/head";
import { useSession, signIn, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import styles from "./styles.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc } from "firebase/firestore";
import {
  FaCheckCircle,
  FaRocket,
  FaStar,
  FaCrown,
  FaTimes,
} from "react-icons/fa";

const PLAN_LEVELS: { [key: string]: number } = {
  Free: 0,
  "Premium Anual": 1,
  "Enterprise 36 Meses": 2,
};

export default function Premium({
  configs,
  userPlan,
}: {
  configs: any;
  userPlan: string;
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const currentUserLevel = PLAN_LEVELS[userPlan] || 0;

  async function handleAction(plano: string, valor: string) {
    if (!session) {
      signIn("google", { callbackUrl: "/premium?fromModal=true" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano,
          valor: valor.replace(",", "."),
          email: session.user?.email,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Erro no pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Planos 2026</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>Turbine sua produtividade</h1>
        </section>

        <div className={styles.plansArea}>
          {currentUserLevel < 1 && (
            <div className={`${styles.card} ${styles.recommended}`}>
              <div className={styles.badge}>RECOMENDADO</div>
              <h2>Premium Plus</h2>
              <div className={styles.price}>R$ {configs.anualValor}</div>
              <ul className={styles.features}>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Tarefas Ilimitadas
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Prioridade Média e Alta
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Editar e Compartilhar
                </li>
                <li style={{ opacity: 0.5 }}>
                  <FaTimes color="#ea3140" /> Filtros e PDF
                </li>
              </ul>
              <button
                onClick={() =>
                  handleAction("Premium Anual", configs.anualValor)
                }
                className={styles.buyButton}
              >
                {loading ? "PROCESSANDO..." : "ASSINAR PREMIUM"}
              </button>
            </div>
          )}

          {currentUserLevel < 2 && (
            <div className={styles.card}>
              <h2>Professional Max</h2>
              <div className={styles.price}>R$ {configs.trienalValor}</div>
              <ul className={styles.features}>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Tudo do Premium
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Filtros Habilitados
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Exportar para PDF
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Suporte VIP WhatsApp
                </li>
              </ul>
              <button
                onClick={() =>
                  handleAction("Enterprise 36 Meses", configs.trienalValor)
                }
                className={`${styles.buyButton} ${styles.darkButton}`}
              >
                UPGRADE PARA MAX
              </button>
            </div>
          )}
        </div>
      </main>
      <ToastContainer theme="dark" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const session = await getSession({ req });
  if (!session) return { redirect: { destination: "/", permanent: false } };

  const userRef = doc(db, "users", session.user?.email as string);
  const userSnap = await getDoc(userRef);
  const adminSnap = await getDoc(
    doc(db, "users", "leogomdesenvolvimento@gmail.com")
  );
  const data = adminSnap.data();

  return {
    props: {
      userPlan: userSnap.data()?.plano || "Free",
      configs: {
        anualValor: data?.planoAnualValor || "118,80",
        trienalValor: data?.planoTrienalValor || "284,40",
      },
    },
  };
};
