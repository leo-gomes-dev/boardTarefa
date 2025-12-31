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
      const userRef = doc(db, "users", userEmail);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBasicValor(data.planoBasicValor || "0,00");
        setBasicDesc(data.planoBasicDescricao || "Essencial para começar");
        setAnualValor(data.planoAnualValor || "118,80");
        setAnualDesc(data.planoAnualDescricao || "Apenas R$ 9,90 por mês");
        setTrienalValor(data.planoTrienalValor || "284,40");
        setTrienalDesc(data.planoTrienalDescricao || "Apenas R$ 7,90 por mês");
      }
      setLoading(false);
    }
    loadConfigs();
  }, [userEmail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", userEmail),
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
      toast.success("TABELA DE PREÇOS ATUALIZADA COM SUCESSO!");
    } catch {
      toast.error("Falha ao salvar configurações.");
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
      <main style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
          Gerenciador de Planos 2026
        </h1>
        <form
          onSubmit={handleSave}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
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
            <h3 style={{ color: "#94a3b8" }}>Configurações Plano Basic</h3>
            <input
              style={{
                width: "100%",
                padding: "12px",
                margin: "8px 0",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
              }}
              value={basicValor}
              onChange={(e) => setBasicValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              style={{
                width: "100%",
                padding: "12px",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
              }}
              value={basicDesc}
              onChange={(e) => setBasicDesc(e.target.value)}
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
            <h3 style={{ color: "#3183ff" }}>Configurações Plano Anual</h3>
            <input
              style={{
                width: "100%",
                padding: "12px",
                margin: "8px 0",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
              }}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              style={{
                width: "100%",
                padding: "12px",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
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
            <h3 style={{ color: "#e74c3c" }}>Configurações Plano Trienal</h3>
            <input
              style={{
                width: "100%",
                padding: "12px",
                margin: "8px 0",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
              }}
              value={trienalValor}
              onChange={(e) => setTrienalValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              style={{
                width: "100%",
                padding: "12px",
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
              }}
              value={trienalDesc}
              onChange={(e) => setTrienalDesc(e.target.value)}
              placeholder="Descrição"
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "18px",
              background: "#3183ff",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            {loading ? "SALVANDO..." : "PUBLICAR ALTERAÇÕES"}
          </button>
        </form>
      </main>
      <ToastContainer theme="dark" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  if (session?.user?.email !== "leogomdesenvolvimento@gmail.com")
    return { redirect: { destination: "/", permanent: false } };
  return { props: { userEmail: session.user.email } };
};
