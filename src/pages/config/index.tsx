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
        setBasicDesc(data.planoBasicDescricao || "Grátis para sempre");
        setAnualValor(data.planoAnualValor || "118,80");
        setAnualDesc(data.planoAnualDescricao || "R$ 9,90 por mês");
        setTrienalValor(data.planoTrienalValor || "284,40");
        setTrienalDesc(
          data.planoTrienalDescricao || "R$ 7,90 por mês (Melhor preço)"
        );
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
      toast.success("PREÇOS ATUALIZADOS PARA 2026!");
    } catch {
      toast.error("Erro ao salvar.");
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
        <h1>Painel Admin - Preços Acadêmicos</h1>
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
            <h3>Plano Basic</h3>
            <input
              style={{ width: "100%", padding: "10px", margin: "5px 0" }}
              value={basicValor}
              onChange={(e) => setBasicValor(e.target.value)}
            />
            <input
              style={{ width: "100%", padding: "10px" }}
              value={basicDesc}
              onChange={(e) => setBasicDesc(e.target.value)}
            />
          </div>
          <div
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3>Plano Anual</h3>
            <input
              style={{ width: "100%", padding: "10px", margin: "5px 0" }}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
            />
            <input
              style={{ width: "100%", padding: "10px" }}
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
            <h3>Plano Trienal (36 Meses)</h3>
            <input
              style={{ width: "100%", padding: "10px", margin: "5px 0" }}
              value={trienalValor}
              onChange={(e) => setTrienalValor(e.target.value)}
            />
            <input
              style={{ width: "100%", padding: "10px" }}
              value={trienalDesc}
              onChange={(e) => setTrienalDesc(e.target.value)}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "15px",
              background: "#3183ff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "SALVANDO..." : "ATUALIZAR TUDO AGORA"}
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
