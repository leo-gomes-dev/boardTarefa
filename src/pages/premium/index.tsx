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
      toast.info("Redirecionando para login...", { theme: "dark" });
      setTimeout(() => {
        signIn();
      }, 1000);
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
      toast.error("Erro ao processar checkout.", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Planos e Preços - OrganizaTask</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>
            {session
              ? `Olá, ${session.user?.name}!`
              : "Escolha seu plano para começar"}
          </h1>
          <p>
            Potencialize sua produtividade com as melhores ferramentas de 2026.
          </p>
        </section>

        <div className={styles.plansArea}>
          {/* PLANO BASIC */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaUser size={30} color="#94a3b8" />
              <span>INDIVIDUAL</span>
              <h2>Free Starter</h2>
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
                <FaCheckCircle color="#2ecc71" /> Acesso Multi-plataforma
              </li>
            </ul>
            <button
              onClick={() => handleCheckout("Basic Free", configs.basicValor)}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {session ? "ACESSAR GRATUITO" : "LOGAR PARA ACESSAR"}
            </button>
          </div>

          {/* PLANO ANUAL */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS RECOMENDADO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>ASSINATURA ANUAL</span>
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
              <li>
                <FaCheckCircle color="#2ecc71" /> Sem anúncios
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

          {/* PLANO TRIENAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>36 MESES</span>
              <h2>Professional Max</h2>
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
                <FaCheckCircle color="#2ecc71" /> Suporte VIP WhatsApp 24/7
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Consultoria de Organização
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> 1 Ano de economia real
              </li>
            </ul>
            <button
              onClick={() =>
                handleCheckout("Enterprise 36 Meses", configs.trienalValor)
              }
              disabled={loading}
              className={`${styles.buyButton} ${styles.darkButton}`}
            >
              {loading ? "CARREGANDO..." : "GARANTIR DESCONTO"}
            </button>
          </div>
        </div>

        <div className={styles.secure}>
          <FaShieldAlt size={14} />
          <span>Pagamento Seguro via Mercado Pago</span>
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
    basicDesc: "Essencial para o dia a dia",
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
