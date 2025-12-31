import Head from "next/head";
import Link from "next/link";
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
          {/* PLANO RECOMENDADO */}
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

            <Link
              href="/pagamento?plano=Premium Plus&valor=118,80"
              className={styles.buyButton}
            >
              ASSINAR AGORA
            </Link>
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

            <Link
              href="/pagamento?plano=Enterprise Vitalício&valor=297,00"
              className={`${styles.buyButton} ${styles.outline}`}
            >
              ADQUIRIR VITALÍCIO
            </Link>
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
