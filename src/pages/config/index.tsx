import { useState, useEffect } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
      if (!userEmail) return;
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
        console.error("Erro ao carregar:", e);
      } finally {
        setLoading(false);
      }
    }
    loadConfigs();
  }, [userEmail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!db) {
      toast.error("Erro crítico: Banco de dados não inicializado.");
      setLoading(false);
      return;
    }

    try {
      // Usamos setDoc para garantir a criação do documento
      const userRef = doc(db, "users", userEmail);

      await setDoc(
        userRef,
        {
          planoAnualValor: anualValor,
          planoAnualDescricao: anualDesc,
          planoVitalicioValor: vitalicioValor,
          planoVitalicioDescricao: vitalicioDesc,
          isAdmin: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      toast.success("🔥 PREÇOS ATUALIZADOS COM SUCESSO!");
    } catch (error: any) {
      console.error("ERRO DETALHADO DO FIREBASE:", error);
      toast.error(`ERRO: ${error.message || "Erro desconhecido ao salvar"}`);
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
      }}
    >
      <Head>
        <title>Ajustar Preços - 2026</title>
      </Head>
      <main style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1>Configurações de Admin</h1>
        <p>Logado como: {userEmail}</p>

        <form
          onSubmit={handleSave}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#3183ff" }}>Plano Anual</h3>
            <input
              style={{
                width: "100%",
                padding: "10px",
                margin: "10px 0",
                background: "#000",
                color: "#fff",
              }}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              style={{
                width: "100%",
                padding: "10px",
                background: "#000",
                color: "#fff",
              }}
              value={anualDesc}
              onChange={(e) => setAnualDesc(e.target.value)}
              placeholder="Descrição"
            />
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#e74c3c" }}>Plano Vitalício</h3>
            <input
              style={{
                width: "100%",
                padding: "10px",
                margin: "10px 0",
                background: "#000",
                color: "#fff",
              }}
              value={vitalicioValor}
              onChange={(e) => setVitalicioValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              style={{
                width: "100%",
                padding: "10px",
                background: "#000",
                color: "#fff",
              }}
              value={vitalicioDesc}
              onChange={(e) => setVitalicioDesc(e.target.value)}
              placeholder="Descrição"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              background: "#3183ff",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES AGORA"}
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
