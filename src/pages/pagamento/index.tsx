import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import Link from "next/link"; // Importação essencial para navegação segura
import {
  FaLock,
  FaCreditCard,
  FaBarcode,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";

export default function Pagamento() {
  const router = useRouter();
  const [metodo, setMetodo] = useState("cartao");

  // Estados para garantir que os valores apareçam mesmo após o refresh
  const [nomePlano, setNomePlano] = useState("Plano Anual Premium Plus");
  const [valorPlano, setValorPlano] = useState("118,80");

  // Sincroniza os dados da URL com o estado da página
  useEffect(() => {
    if (router.isReady) {
      if (router.query.plano) setNomePlano(String(router.query.plano));
      if (router.query.valor) setValorPlano(String(router.query.valor));
    }
  }, [router.isReady, router.query]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Pagamento Seguro - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        {/* Usando Link para garantir que a navegação funcione 100% das vezes */}
        <Link
          href="/premium"
          className={styles.backLink}
          style={{ textDecoration: "none" }}
        >
          <button type="button" className={styles.backLinkButton}>
            <FaArrowLeft /> Voltar e alterar plano
          </button>
        </Link>

        <div className={styles.checkoutWrapper}>
          <section className={styles.summary}>
            <h2>Resumo do pedido</h2>
            <div className={styles.planInfo}>
              <span>{nomePlano}</span>
              <strong>R$ {valorPlano}</strong>
            </div>
            <p className={styles.disclaimer}>
              Acesso liberado imediatamente após a confirmação do pagamento.
            </p>
            <div className={styles.secureBadge}>
              <FaLock /> Ambiente 100% seguro
            </div>
          </section>

          <section className={styles.paymentBox}>
            <h1>Forma de pagamento</h1>

            <div className={styles.methods}>
              <button
                type="button"
                className={metodo === "cartao" ? styles.active : ""}
                onClick={() => setMetodo("cartao")}
              >
                <FaCreditCard /> Cartão
              </button>
              <button
                type="button"
                className={metodo === "pix" ? styles.active : ""}
                onClick={() => setMetodo("pix")}
              >
                <FaBarcode /> Pix
              </button>
            </div>

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              {metodo === "cartao" ? (
                <>
                  <input type="text" placeholder="Número do cartão" required />
                  <input type="text" placeholder="Nome no cartão" required />
                  <div className={styles.row}>
                    <input type="text" placeholder="MM/AA" required />
                    <input type="text" placeholder="CVV" required />
                  </div>
                </>
              ) : (
                <div className={styles.pixArea}>
                  <p>O QR Code Pix será gerado após clicar no botão abaixo.</p>
                  <span>Liberação instantânea</span>
                </div>
              )}

              <button type="submit" className={styles.payButton}>
                {metodo === "cartao" ? "FINALIZAR COMPRA" : "GERAR CHAVE PIX"}
              </button>
            </form>

            <div className={styles.footerSecure}>
              <FaShieldAlt /> Checkout protegido por criptografia ponta a ponta.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
