import Head from "next/head";
import styles from "./styles.module.css";
import {
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaInfinity,
} from "react-icons/fa";

export default function Premium() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Upgrade Premium - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.header}>
          <FaRocket size={50} color="#3183ff" />
          <h1>Eleve sua produtividade ao próximo nível</h1>
          <p>
            Junte-se a milhares de usuários que não possuem limites para
            organizar sua rotina.
          </p>
        </section>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>PLANO ANUAL</span>
            <h2>Versão Premium</h2>
            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <span className={styles.amount}>9,90</span>
              <span className={styles.month}>/mês</span>
            </div>
            <p>Cobrado anualmente (R$ 118,80)</p>
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
              <FaCheckCircle color="#2ecc71" /> Sem anúncios na interface
            </li>
            <li>
              <FaCheckCircle color="#2ecc71" /> Backup em nuvem em tempo real
            </li>
          </ul>

          <a
            href="checkout.stripe.com" // Substitua pelo link real do Stripe/MercadoPago
            className={styles.buyButton}
          >
            ASSINAR AGORA
          </a>

          <div className={styles.secure}>
            <FaShieldAlt size={14} />
            <span>Pagamento 100% seguro via criptografia</span>
          </div>
        </div>

        <button
          onClick={() => window.history.back()}
          className={styles.backButton}
        >
          Voltar para o meu painel
        </button>
      </main>
    </div>
  );
}
