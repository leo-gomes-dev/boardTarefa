import Head from "next/head";
import { useState } from "react";
import styles from "./styles.module.css";
import {
  FaLock,
  FaCreditCard,
  FaBarcode,
  FaPix,
  FaArrowLeft,
} from "react-icons/fa6";

// Importe o FaShieldAlt da categoria 'fa' (versão 5)
import { FaShieldAlt } from "react-icons/fa";
import { useRouter } from "next/router";

export default function Pagamento() {
  const router = useRouter();
  const [metodo, setMetodo] = useState("cartao");

  return (
    <div className={styles.container}>
      <Head>
        <title>Pagamento Seguro - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <button onClick={() => router.back()} className={styles.backLink}>
          <FaArrowLeft /> Voltar e alterar plano
        </button>

        <div className={styles.checkoutWrapper}>
          {/* LADO ESQUERDO: RESUMO */}
          <section className={styles.summary}>
            <h2>Resumo do pedido</h2>
            <div className={styles.planInfo}>
              <span>Plano Anual Premium Plus</span>
              <strong>R$ 118,80</strong>
            </div>
            <p className={styles.disclaimer}>
              Acesso ilimitado liberado imediatamente após a confirmação.
            </p>
            <div className={styles.secureBadge}>
              <FaLock /> Ambientes 100% criptografado
            </div>
          </section>

          {/* LADO DIREITO: PAGAMENTO */}
          <section className={styles.paymentBox}>
            <h1>Como deseja pagar?</h1>

            <div className={styles.methods}>
              <button
                className={metodo === "cartao" ? styles.active : ""}
                onClick={() => setMetodo("cartao")}
              >
                <FaCreditCard /> Cartão
              </button>
              <button
                className={metodo === "pix" ? styles.active : ""}
                onClick={() => setMetodo("pix")}
              >
                <FaPix /> Pix
              </button>
            </div>

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              {metodo === "cartao" ? (
                <>
                  <input type="text" placeholder="Número do cartão" required />
                  <input
                    type="text"
                    placeholder="Nome impresso no cartão"
                    required
                  />
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Validade (MM/AA)"
                      required
                    />
                    <input type="text" placeholder="CVV" required />
                  </div>
                </>
              ) : (
                <div className={styles.pixArea}>
                  <p>O QR Code será gerado na próxima tela.</p>
                  <span>5% de desconto no PIX</span>
                </div>
              )}

              <button type="submit" className={styles.payButton}>
                {metodo === "cartao"
                  ? "CONFIRMAR PAGAMENTO"
                  : "GERAR PIX AGORA"}
              </button>
            </form>

            <div className={styles.footerSecure}>
              <FaShieldAlt /> Checkout seguro via Stripe & LeoGomesDev
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
