import { useState } from "react";
import Head from "next/head";
import Link from "next/link"; // Import necessário para o Link
import { useSession, signIn, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import styles from "./styles.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc } from "firebase/firestore";
import { FaCheckCircle, FaRocket, FaTimes } from "react-icons/fa";

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

  const currentUserLevel = PLAN_LEVELS[userPlan] ?? 0;

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
          {/* MENSAGEM PARA ENTERPRISE */}
          {currentUserLevel >= 2 && (
            <div
              style={{
                background: "#0f172a",
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                color: "#FFF",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <h2 style={{ marginBottom: "10px" }}>
                🎉 Você já possui o plano mais completo!
              </h2>

              <p
                style={{ opacity: 0.8, fontSize: "15px", marginBottom: "25px" }}
              >
                Todos os recursos do OrganizaTask 2026 já estão liberados para
                sua conta.
              </p>

              <a
                href="/dashboard"
                style={{
                  display: "inline-block",
                  backgroundColor: "#3183ff",
                  color: "#FFF",
                  padding: "10px 22px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ⬅ Voltar ao painel
              </a>
            </div>
          )}

          {/* PREMIUM – somente para FREE */}
          {currentUserLevel === 0 && (
            <div className={`${styles.card} ${styles.recommended}`}>
              <div className={styles.badge}>RECOMENDADO</div>
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <FaRocket color="#3183ff" size={22} /> Premium Plus
              </h2>
              <div className={styles.price}>R$ {configs.anualValor}</div>
              <ul className={styles.features}>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Tarefas Ilimitadas
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Prioridades Baixa, Média e
                  Alta
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Editar Tarefa
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Suporte Prioritário
                </li>
                <li style={{ opacity: 0.5 }}>
                  <FaTimes color="#ea3140" /> Filtros Habilitados
                </li>
                <li style={{ opacity: 0.5 }}>
                  <FaTimes color="#ea3140" /> Exportar para PDF
                </li>
                <li style={{ opacity: 0.5 }}>
                  <FaTimes color="#ea3140" /> Deixar tarefa pública
                </li>
                <li style={{ opacity: 0.5 }}>
                  <FaTimes color="#ea3140" /> Compartilhar Tarefa
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

          {/* ENTERPRISE – para FREE e PREMIUM */}
          {currentUserLevel < 2 && (
            <div className={styles.card}>
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <FaCheckCircle color="#3183ff" size={22} /> Professional Max
              </h2>
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
                  <FaCheckCircle color="#2ecc71" /> Deixar tarefa pública
                </li>
                <li>
                  <FaCheckCircle color="#2ecc71" /> Compartilhar Tarefa
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

        {/* BOTÃO VOLTAR - Texto clicável conforme seu CSS original */}
        <Link href="/dashboard" className={styles.backButton}>
          Voltar ao painel
        </Link>
      </main>

      <ToastContainer theme="dark" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (!session?.user?.email) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  const userRef = doc(db, "users", session.user.email);
  const userSnap = await getDoc(userRef);

  const adminSnap = await getDoc(
    doc(db, "users", "leogomdesenvolvimento@gmail.com")
  );
  const adminData = adminSnap.data();

  return {
    props: {
      userPlan: userSnap.exists() ? userSnap.data()?.plano ?? "Free" : "Free",
      configs: {
        anualValor: adminData?.planoAnualValor ?? "118,80",
        trienalValor: adminData?.planoTrienalValor ?? "284,40",
      },
    },
  };
};
