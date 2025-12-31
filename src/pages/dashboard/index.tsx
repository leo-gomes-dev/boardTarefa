import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2, FiSettings } from "react-icons/fi";
import { FaTrash, FaEdit, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/router";

import { db } from "../../services/firebaseConnection";

import {
  addDoc,
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Link from "next/link";

import { toast } from "react-toastify";
import { LimitModal } from "@/components/modal/LimitModal";

interface HomeProps {
  user: {
    email: string;
  };
}

interface TaskProps {
  id: string;
  created: Date;
  public: boolean;
  tarefa: string;
  user: string;
  completed?: boolean;
  priority: "baixa" | "media" | "alta";
}

export default function Dashboard({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [priority, setPriority] = useState("baixa");
  const [filter, setFilter] = useState("all");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const router = useRouter();
  const { session_id } = router.query;

  const ADMIN_EMAIL = "leogomdesenvolvimento@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    async function checkPremium() {
      if (!user?.email) return;
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().status === "premium") {
        setIsPremium(true);
      }
    }
    checkPremium();
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const tarefasRef = collection(db, "tarefas");
    const q = query(
      tarefasRef,
      orderBy("created", "desc"),
      where("user", "==", user?.email)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let lista = [] as TaskProps[];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({
          id: doc.id,
          tarefa: data.tarefa,
          created: data.created?.toDate ? data.created.toDate() : new Date(),
          user: data.user,
          public: data.public,
          completed: data.completed || false,
          priority: data.priority || "baixa",
        });
      });
      setTasks(lista);
      if (!isPremium && lista.length >= 30) setShowLimitModal(true);
    });

    return () => unsub();
  }, [user?.email, isPremium]);

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input.trim() === "") {
      toast.warn("Preencha a tarefa!");
      return;
    }

    try {
      if (editingTaskId) {
        const docRef = doc(db, "tarefas", editingTaskId);
        await updateDoc(docRef, {
          tarefa: input,
          public: publicTask,
          priority: priority,
        });
        setEditingTaskId(null);
        toast.success("Tarefa atualizada!");
      } else {
        await addDoc(collection(db, "tarefas"), {
          tarefa: input,
          created: new Date(),
          user: user?.email,
          public: publicTask,
          completed: false,
          priority: priority,
        });
        toast.success("Tarefa registrada!");
      }

      setInput("");
      setPublicTask(false);
      setPriority("baixa");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar no banco.");
    }
  }

  // Funções de Deletar, Editar e Share simplificadas para o exemplo
  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPriority(item.priority);
    setPublicTask(item.public);
    setEditingTaskId(item.id);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas - 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            {/* Cabeçalho com Título e Botão Config à Direita */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h1 className={styles.title} style={{ margin: 0 }}>
                Qual sua tarefa hoje?
              </h1>
              {isAdmin && (
                <Link
                  href="/config"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "#3183ff",
                    color: "#FFF",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  <FiSettings size={16} /> Config
                </Link>
              )}
            </div>

            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="Digite sua tarefa..."
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
              />

              {/* Alinhamento de Prioridade e Checkbox à esquerda */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginTop: "15px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ color: "#FFF", fontSize: "14px" }}>
                    Prioridade:
                  </span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      padding: "5px",
                      borderRadius: "4px",
                      background: "#121212",
                      color: "#FFF",
                      border: "1px solid #333",
                    }}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div
                  className={styles.checkboxArea}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    checked={publicTask}
                    onChange={(e) => setPublicTask(e.target.checked)}
                  />
                  <span style={{ color: "#FFF" }}>Deixar tarefa pública?</span>
                </div>
              </div>

              <button
                className={styles.button}
                type="submit"
                style={{ marginTop: "20px" }}
              >
                {editingTaskId ? "Atualizar Tarefa" : "Registrar Tarefa"}
              </button>
            </form>
          </div>
        </section>

        {/* Listagem de tarefas abaixo... */}
        <section className={styles.taskContainer}>
          {/* O mapeamento das tarefas continua aqui como no seu código original */}
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  if (!session?.user)
    return { redirect: { destination: "/", permanent: false } };
  return { props: { user: { email: session?.user?.email } } };
};
