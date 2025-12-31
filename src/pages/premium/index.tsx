import { useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react"; // Assumindo que você usa next-auth
import styles from "./styles.module.css";
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
    if (!session?.user?.email) {
      alert("Por favor, faça login para continuar.");
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
        // Redireciona para o Checkout Pro do Mercado Pago (com PIX e Cartão)
        window.location.href = data.url;
      } else {
        throw new Error("Falha ao gerar link de pagamento");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar pagamento. Tente novamente.");
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
    </div>
  );
}
