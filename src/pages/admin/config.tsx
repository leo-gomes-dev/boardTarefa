import { useState, useEffect } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import styles from "./styles.module.css";
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
      // Busca as configurações no seu documento de usuário admin
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
    <div className={styles.container}>
      <Head>
        <title>Configurações de Preço - Admin</title>
      </Head>

      <main
        className={styles.main}
        style={{
          padding: "40px",
          color: "#fff",
          backgroundColor: "#0f0f0f",
          minHeight: "100vh",
        }}
      >
        <h1>Configurar Preços dos Planos</h1>

        <form
          onSubmit={handleSaveConfig}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "500px",
            marginTop: "20px",
          }}
        >
          <div>
            <h3>Plano Anual</h3>
            <label>Valor (ex: 1,00):</label>
            <input
              style={{ width: "100%", padding: "10px", borderRadius: "4px" }}
              value={anualValor}
              onChange={(e) => setAnualValor(e.target.value)}
            />
            <label>Descrição Texto:</label>
            <input
              style={{ width: "100%", padding: "10px", borderRadius: "4px" }}
              value={anualDesc}
              onChange={(e) => setAnualDesc(e.target.value)}
            />
          </div>

          <hr />

          <div>
            <h3>Plano Vitalício</h3>
            <label>Valor (ex: 297,00):</label>
            <input
              style={{ width: "100%", padding: "10px", borderRadius: "4px" }}
              value={vitalicioValor}
              onChange={(e) => setVitalicioValor(e.target.value)}
            />
            <label>Descrição Texto:</label>
            <input
              style={{ width: "100%", padding: "10px", borderRadius: "4px" }}
              value={vitalicioDesc}
              onChange={(e) => setVitalicioDesc(e.target.value)}
            />
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
              cursor: "pointer",
            }}
          >
            {loading ? "Salvando..." : "SALVAR CONFIGURAÇÕES"}
          </button>
        </form>
        <ToastContainer />
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  // SÓ VOCÊ pode acessar essa página
  if (session?.user?.email !== "leogomdesenvolvimento@gmail.com") {
    return {
      redirect: {
        destination: "/admin",
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
