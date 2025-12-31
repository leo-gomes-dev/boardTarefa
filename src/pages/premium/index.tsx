import { useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import styles from "./styles.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaInfinity,
  FaStar,
  FaCrown,
} from "react-icons/fa";

export default function Premium() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleCheckout(plano: string, valor: string) {
    // Validação de login com Toast profissional
    if (!session?.user?.email) {
      toast.warn("Por favor, faça login para continuar!", {
        position: "top-center",
        autoClose: 4000,
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
          valor: valor,
          email: session.user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redireciona para o Checkout Pro (Mercado Pago)
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Falha ao gerar link de pagamento");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar pagamento. Tente novamente.", {
        position: "bottom-right",
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
          {/* PLANO ANUAL */}
          <div className={`${styles.card} ${styles.recommended}`}>
            <div className={styles.badge}>MAIS VENDIDO</div>
            <div className={styles.cardHeader}>
              <FaStar size={30} color="#f1c40f" />
              <span>PLANO ANUAL</span>
              <h2>Premium Plus</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>9,90</span>
                <span className={styles.month}>/mês</span>
              </div>
              <p className={styles.totalPrice}>R$ 118,80 cobrados anualmente</p>
            </div>

            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> <FaInfinity /> Tarefas
                ilimitadas
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Suporte prioritário 24/7
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Backup em tempo real
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("Premium Plus", "118,80")}
              disabled={loading}
              className={styles.buyButton}
            >
              {loading ? "PROCESSANDO..." : "ASSINAR AGORA"}
            </button>
          </div>

          {/* PLANO VITALÍCIO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaCrown size={30} color="#e74c3c" />
              <span>PLANO ÚNICO</span>
              <h2>Enterprise</h2>
              <div className={styles.price}>
                <span className={styles.currency}>R$</span>
                <span className={styles.amount}>297</span>
                <span className={styles.month}>/único</span>
              </div>
              <p className={styles.totalPrice}>
                Acesso vitalício sem mensalidade
              </p>
            </div>

            <ul className={styles.features}>
              <li>
                <FaCheckCircle color="#2ecc71" /> Tudo do Plano Anual
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Exportação de dados (CSV)
              </li>
              <li>
                <FaCheckCircle color="#2ecc71" /> Mentoria de produtividade
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("Enterprise Vitalício", "297,00")}
              disabled={loading}
              className={`${styles.buyButton} ${styles.outline}`}
            >
              {loading ? "PROCESSANDO..." : "ADQUIRIR VITALÍCIO"}
            </button>
          </div>
        </div>

        <div className={styles.secure}>
          <FaShieldAlt size={14} />
          <span>Pagamento 100% seguro via criptografia em 2026</span>
        </div>
      </main>

      {/* Componente necessário para exibir os avisos na tela */}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}
