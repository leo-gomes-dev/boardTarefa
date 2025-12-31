import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Importante para o e-mail do cliente
import {
  FaLock,
  FaCreditCard,
  FaBarcode,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Pagamento() {
  const { data: session } = useSession();
  const router = useRouter();

  const [metodo, setMetodo] = useState("cartao");
  const [loading, setLoading] = useState(false);
  const [nomePlano, setNomePlano] = useState("Carregando...");
  const [valorPlano, setValorPlano] = useState("0,00");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const planoQuery = router.query.plano || "Plano Anual Premium Plus";
      const valorQuery = router.query.valor || "118,80";

      setNomePlano(String(planoQuery));
      setValorPlano(String(valorQuery));
      setIsDataLoaded(true);
    }
  }, [router.isReady, router.query]);

  // Função que integra com o Stripe
  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: nomePlano,
          valor: valorPlano,
          email: session?.user?.email, // Envia o email do usuário logado
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redireciona para o checkout seguro do Stripe (Cartão ou Pix)
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erro ao gerar checkout");
      }
    } catch (err) {
      console.error("Erro no pagamento:", err);
      toast.error("Houve um erro ao iniciar o pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isDataLoaded) {
    return <div className={styles.loadingContainer}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Pagamento Seguro - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <Link href="/premium" style={{ textDecoration: "none" }}>
          <button type="button" className={styles.backLink}>
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
              Acesso liberado imediatamente após a confirmação.
            </p>
            <div className={styles.secureBadge}>
              <FaLock /> Ambiente 100% seguro
            </div>
          </section>

          <section className={styles.paymentBox}>
            <h1>Checkout Seguro</h1>

            <div className={styles.methods}>
              <button
                type="button"
                className={metodo === "cartao" ? styles.active : ""}
                onClick={() => setMetodo("cartao")}
              >
                <FaCreditCard /> Cartão de Crédito
              </button>
              <button
                type="button"
                className={metodo === "pix" ? styles.active : ""}
                onClick={() => setMetodo("pix")}
              >
                <FaBarcode /> Pix
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCheckout}>
              <div className={styles.pixArea}>
                <p>
                  Ao clicar no botão abaixo, você será redirecionado para a
                  página segura do
                  <strong> Stripe</strong> para concluir o pagamento via{" "}
                  {metodo === "cartao" ? "Cartão" : "Pix"}.
                </p>
                {metodo === "pix" && (
                  <span>Liberação instantânea via Pix!</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.payButton}
                disabled={loading}
              >
                {loading ? "PROCESSANDO..." : `PAGAR R$ ${valorPlano}`}
              </button>
            </form>

            <div className={styles.footerSecure}>
              <FaShieldAlt /> Processado com segurança por Stripe
            </div>
          </section>
        </div>
      </main>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}
