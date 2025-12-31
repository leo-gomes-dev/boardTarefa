import { useState, useEffect } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { db } from "../services/firebaseConnection"; // Ajustado o caminho (um nível a menos)
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ConfigProps {
  userEmail: string;
}

export default function AdminConfig({ userEmail }: ConfigProps) {
  const [anualValor, setAnualValor] = useState("");
  const [anualDesc, setAnualDesc] = useState("");
  const [vitalicioValor, setVitalicioValor] = useState("");
  const [vitalicioDesc, setVitalicioDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfigs() {
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
      setLoading(false);
    }
    loadConfigs();
  }, [userEmail]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, "users", userEmail);
      await updateDoc(userRef, {
        planoAnualValor: anualValor,
        planoAnualDescricao: anualDesc,
        planoVitalicioValor: vitalicioValor,
        planoVitalicioDescricao: vitalicioDesc,
      });
      toast.success("Preços atualizados no Firebase!");
    } catch (error) {
      toast.error("Erro ao salvar no banco de dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        minHeight: "100vh",
        color: "#fff",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <Head>
        <title>Painel de Preços - Admin</title>
      </Head>

      <main style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
          Configurar Preços
        </h1>

        <form
          onSubmit={handleSaveConfig}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "25px",
            marginTop: "30px",
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#3183ff", marginBottom: "15px" }}>
              Plano Anual
            </h3>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Valor do Checkout (ex: 1.00):
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
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Texto de Exibição:
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
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#e74c3c", marginBottom: "15px" }}>
              Plano Vitalício
            </h3>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Valor do Checkout (ex: 297.00):
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
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Texto de Exibição:
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
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              backgroundColor: "#3183ff",
              color: "#fff",
              border: 0,
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {loading ? "SALVANDO..." : "ATUALIZAR PREÇOS AGORA"}
          </button>
        </form>
        <ToastContainer theme="dark" />
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  // VALIDAÇÃO DE SEGURANÇA 2026
  if (session?.user?.email !== "leogomdesenvolvimento@gmail.com") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userEmail: session.user.email,
    },
  };
};
