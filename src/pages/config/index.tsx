import { useState, useEffect } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Alterado para setDoc
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PaginaConfiguracoes({
  userEmail,
}: {
  userEmail: string;
}) {
  const [anualValor, setAnualValor] = useState("");
  const [anualDesc, setAnualDesc] = useState("");
  const [vitalicioValor, setVitalicioValor] = useState("");
  const [vitalicioDesc, setVitalicioDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const userRef = doc(db, "users", userEmail);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAnualValor(data.planoAnualValor || "118,80");
          setAnualDesc(
            data.planoAnualDescricao || "R$ 118,80 cobrados anualmente"
          );
          setVitalicioValor(data.planoVitalicioValor || "297,00");
          setVitalicioDesc(
            data.planoVitalicioDescricao || "Acesso vitalício sem mensalidade"
          );
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    }
    loadConfigs();
  }, [userEmail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, "users", userEmail);

      // setDoc com merge: true resolve o erro de salvar caso o documento não exista
      await setDoc(
        userRef,
        {
          planoAnualValor: anualValor,
          planoAnualDescricao: anualDesc,
          planoVitalicioValor: vitalicioValor,
          planoVitalicioDescricao: vitalicioDesc,
          lastUpdate: new Date(),
        },
        { merge: true }
      );

      toast.success("Preços atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar no Firebase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        color: "#fff",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <Head>
        <title>Ajustar Preços - OrganizaTask 2026</title>
      </Head>
      <main style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ borderBottom: "1px solid #333", paddingBottom: "15px" }}>
          Gerenciar Valores dos Planos
        </h1>

        <form
          onSubmit={handleSave}
          style={{
            marginTop: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#3183ff", marginBottom: "10px" }}>
              Plano Anual
            </h3>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Valor Checkout (ex: 1,00):
            </label>
            <input
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
            />
            <label style={{ display: "block", marginTop: "10px" }}>
              Texto na Tela Premium:
            </label>
            <input
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
              value={anualDesc}
              onChange={(e) => setAnualDesc(e.target.value)}
            />
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#e74c3c", marginBottom: "10px" }}>
              Plano Vitalício
            </h3>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Valor Checkout (ex: 297,00):
            </label>
            <input
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
              value={vitalicioValor}
              onChange={(e) => setVitalicioValor(e.target.value)}
            />
            <label style={{ display: "block", marginTop: "10px" }}>
              Texto na Tela Premium:
            </label>
            <input
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
              value={vitalicioDesc}
              onChange={(e) => setVitalicioDesc(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              background: "#3183ff",
              border: 0,
              color: "#fff",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "SALVANDO..." : "ATUALIZAR TODOS OS PREÇOS"}
          </button>
        </form>
        <ToastContainer theme="dark" />
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (session?.user?.email !== "leogomdesenvolvimento@gmail.com") {
    return { redirect: { destination: "/admin", permanent: false } };
  }
  return { props: { userEmail: session.user.email } };
};
