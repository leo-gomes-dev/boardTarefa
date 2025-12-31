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
  const [basicValor, setBasicValor] = useState("");
  const [basicDesc, setBasicDesc] = useState("");
  const [anualValor, setAnualValor] = useState("");
  const [anualDesc, setAnualDesc] = useState("");
  const [trienalValor, setTrienalValor] = useState("");
  const [trienalDesc, setTrienalDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfigs() {
      if (!userEmail) return;
      try {
        const userRef = doc(db, "users", userEmail);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Carregando Basic
          setBasicValor(data.planoBasicValor || "0,00");
          setBasicDesc(data.planoBasicDescricao || "Grátis para iniciantes");
          // Carregando Anual
          setAnualValor(data.planoAnualValor || "118,80");
          setAnualDesc(data.planoAnualDescricao || "Equivalente a R$ 9,90/mês");
          // Carregando Trienal (Substituindo Vitalício)
          setTrienalValor(data.planoTrienalValor || "297,00");
          setTrienalDesc(
            data.planoTrienalDescricao || "Economia máxima por 3 anos"
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

    try {
      const userRef = doc(db, "users", userEmail);

      await setDoc(
        userRef,
        {
          planoBasicValor: basicValor,
          planoBasicDescricao: basicDesc,
          planoAnualValor: anualValor,
          planoAnualDescricao: anualDesc,
          planoTrienalValor: trienalValor,
          planoTrienalDescricao: trienalDesc,
          isAdmin: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      toast.success("🔥 TODOS OS 03 PLANOS ATUALIZADOS!");
    } catch (error: any) {
      toast.error(`ERRO: ${error.message || "Erro ao salvar"}`);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    background: "#000",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "4px",
  };

  const cardStyle = {
    background: "#1a1a1a",
    padding: "20px",
    borderRadius: "8px",
    borderLeft: "4px solid",
  };

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
        <title>Painel Admin 2026 - OrganizaTask</title>
      </Head>
      <main style={{ maxWidth: "700px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "10px" }}>Configurações de Preços</h1>
        <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
          Admin: {userEmail}
        </p>

        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "25px" }}
        >
          {/* CONFIG BASIC */}
          <div style={{ ...cardStyle, borderLeftColor: "#94a3b8" }}>
            <h3 style={{ color: "#94a3b8" }}>1. Plano Basic (Starter)</h3>
            <input
              style={inputStyle}
              value={basicValor}
              onChange={(e) => setBasicValor(e.target.value)}
              placeholder="Valor (ex: 0,00)"
            />
            <input
              style={inputStyle}
              value={basicDesc}
              onChange={(e) => setBasicDesc(e.target.value)}
              placeholder="Descrição curta"
            />
          </div>

          {/* CONFIG ANUAL */}
          <div style={{ ...cardStyle, borderLeftColor: "#3183ff" }}>
            <h3 style={{ color: "#3183ff" }}>2. Plano Anual (Premium Plus)</h3>
            <input
              style={inputStyle}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
              placeholder="Valor (ex: 118,80)"
            />
            <input
              style={inputStyle}
              value={anualDesc}
              onChange={(e) => setAnualDesc(e.target.value)}
              placeholder="Descrição curta"
            />
          </div>

          {/* CONFIG TRIENAL */}
          <div style={{ ...cardStyle, borderLeftColor: "#e74c3c" }}>
            <h3 style={{ color: "#e74c3c" }}>
              3. Plano 36 Meses (Enterprise Gold)
            </h3>
            <input
              style={inputStyle}
              value={trienalValor}
              onChange={(e) => setTrienalValor(e.target.value)}
              placeholder="Valor (ex: 297,00)"
            />
            <input
              style={inputStyle}
              value={trienalDesc}
              onChange={(e) => setTrienalDesc(e.target.value)}
              placeholder="Descrição curta"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "18px",
              background: "#3183ff",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              transition: "0.2s",
            }}
          >
            {loading ? "SALVANDO..." : "PUBLICAR NOVOS PREÇOS"}
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
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { userEmail: session.user.email } };
};
