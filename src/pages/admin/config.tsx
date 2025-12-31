import { useState, useEffect } from "react";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
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
        setAnualValor(data.planoAnualValor?.toString() || "");
        setAnualDesc(data.planoAnualDescricao || "");
        setVitalicioValor(data.planoVitalicioValor?.toString() || "");
        setVitalicioDesc(data.planoVitalicioDescricao || "");
      }
      setLoading(false);
    }
    loadConfigs();
  }, [userEmail]);

  const handleSave = async () => {
    setLoading(true);
    const userRef = doc(db, "users", userEmail);
    try {
      await updateDoc(userRef, {
        planoAnualValor: parseFloat(anualValor),
        planoAnualDescricao: anualDesc,
        planoVitalicioValor: parseFloat(vitalicioValor),
        planoVitalicioDescricao: vitalicioDesc,
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando configurações...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Configurações de Planos (Admin)</h1>
      <label>
        Valor Anual (R$):{" "}
        <input
          type="number"
          step="0.01"
          value={anualValor}
          onChange={(e) => setAnualValor(e.target.value)}
        />
      </label>
      <br />
      <label>
        Descrição Anual:{" "}
        <input
          value={anualDesc}
          onChange={(e) => setAnualDesc(e.target.value)}
        />
      </label>
      <br />
      <label>
        Valor Vitalício (R$):{" "}
        <input
          type="number"
          step="0.01"
          value={vitalicioValor}
          onChange={(e) => setVitalicioValor(e.target.value)}
        />
      </label>
      <br />
      <label>
        Descrição Vitalícia:{" "}
        <input
          value={vitalicioDesc}
          onChange={(e) => setVitalicioDesc(e.target.value)}
        />
      </label>
      <br />
      <button onClick={handleSave} disabled={loading}>
        Salvar
      </button>
      <ToastContainer />
    </div>
  );
}

// Proteja essa página apenas para admins (usando a mesma lógica do seu /admin)
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  // Adapte esta verificação para a sua lista de e-mails admin real
  if (
    !session?.user ||
    session.user.email !== "leogomdesenvolvimento@gmail.com"
  ) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { userEmail: session.user.email } };
};
