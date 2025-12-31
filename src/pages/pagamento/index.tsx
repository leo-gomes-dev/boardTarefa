import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Importante para o e-mail do cliente
import { FaLock, FaShieldAlt, FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Pagamento() {
  const { data: session } = useSession();
  const router = useRouter();

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

      // DISPARAR O REDIRECIONAMENTO ASSIM QUE CARREGAR?
      // handleCheckout();
    }
  }, [router.isReady, router.query]);

  // Função que integra com o Mercado Pago
  async function handleCheckout(e?: React.FormEvent) {
    e?.preventDefault(); // Previne comportamento padrão se for chamado de um botão

    if (!session?.user?.email) {
      toast.error("Você precisa estar logado.");
      return;
    }

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
        // Redireciona para o checkout seguro do Mercado Pago (Pix, Cartão, Boleto)
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

            {/* A escolha de método de pagamento foi removida pois o MP faz isso automaticamente */}

            <form className={styles.form} onSubmit={handleCheckout}>
              <div className={styles.pixArea}>
                <p>
                  Ao clicar no botão abaixo, você será redirecionado para a
                  página segura do
                  <strong> Mercado Pago</strong> para concluir o pagamento via
                  Cartão, Boleto ou Pix.
                </p>
              </div>

              <button
                type="submit"
                className={styles.payButton}
                disabled={loading}
              >
                {loading ? "PROCESSANDO..." : `IR PARA O PAGAMENTO`}
              </button>
            </form>

            <div className={styles.footerSecure}>
              <FaShieldAlt /> Processado com segurança por Mercado Pago
            </div>
          </section>
        </div>
      </main>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}
