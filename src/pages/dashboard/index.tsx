import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession, signOut } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2 } from "react-icons/fi";
import { FaTrash, FaEdit, FaCheckCircle } from "react-icons/fa";

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
} from "firebase/firestore";
import Link from "next/link";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Carrega as tarefas em tempo real
  useEffect(() => {
    async function loadTarefas() {
      const tarefasRef = collection(db, "tarefas");
      const q = query(
        tarefasRef,
        orderBy("created", "desc"),
        where("user", "==", user?.email)
      );

      onSnapshot(q, (snapshot) => {
        let lista = [] as TaskProps[];
        snapshot.forEach((doc) => {
          const data = doc.data();
          lista.push({
            id: doc.id,
            tarefa: data.tarefa,
            created: data.created,
            user: data.user,
            public: data.public,
            completed: data.completed || false,
            priority: data.priority || "baixa",
          });
        });
        setTasks(lista);
      });
    }

    loadTarefas();
  }, [user?.email]);

  // Função para Registrar ou Editar Tarefa
  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input === "") {
      toast.warn("Digite o texto da tarefa!");
      return;
    }

    try {
      if (editingTaskId) {
        // Lógica de Edição
        const docRef = doc(db, "tarefas", editingTaskId);
        await updateDoc(docRef, {
          tarefa: input,
          public: publicTask,
          priority: priority,
        });
        setEditingTaskId(null);
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        // Lógica de Registro com verificação de limite
        if (tasks.length >= 50) {
          setShowLimitModal(true);
          return;
        }

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

      // Limpa formulário
      setInput("");
      setPriority("baixa");
      setPublicTask(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("Ops! Algo deu errado ao salvar.");
    }
  }

  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPublicTask(item.public);
    setPriority(item.priority);
    setEditingTaskId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteTask(id: string) {
    try {
      const docRef = doc(db, "tarefas", id);
      await deleteDoc(docRef);
      toast.success("Tarefa removida!");
    } catch (err) {
      toast.error("Erro ao deletar tarefa.");
    }
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    const docRef = doc(db, "tarefas", id);
    await updateDoc(docRef, { completed: !completed });
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
    toast.info("Link copiado!");
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas - 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h1 className={styles.title}>
                {editingTaskId ? "Editando tarefa" : "Nova tarefa"}
              </h1>
              <button
                onClick={() => signOut()}
                style={{
                  backgroundColor: "#ea3140",
                  color: "#FFF",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Sair
              </button>
            </div>

            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="O que você precisa fazer?"
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  margin: "20px 0",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <label style={{ color: "#FFF", fontWeight: "bold" }}>
                    Prioridade:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      backgroundColor: "#2d2e37",
                      color: "#fff",
                      border: "1px solid #444",
                    }}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <label
                  style={{
                    color: "#FFF",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={publicTask}
                    onChange={(e) => setPublicTask(e.target.checked)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  Tornar tarefa pública
                </label>
              </div>

              <button className={styles.button} type="submit">
                {editingTaskId ? "Salvar Alterações" : "Adicionar Tarefa"}
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskList}>
          <h2 style={{ color: "#FFF", marginBottom: "20px" }}>
            Minhas tarefas
          </h2>
          {tasks.map((item) => (
            <article key={item.id} className={styles.taskItem}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {item.public && (
                    <span
                      style={{
                        backgroundColor: "#3183ff",
                        color: "#FFF",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      PÚBLICA
                    </span>
                  )}
                  <span
                    style={{
                      color:
                        item.priority === "alta"
                          ? "#ea3140"
                          : item.priority === "media"
                          ? "#ffb800"
                          : "#00e676",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.priority}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{ background: "transparent", border: 0 }}
                    title="Editar"
                  >
                    <FaEdit size={20} color="#3183ff" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(item.id)}
                    style={{ background: "transparent", border: 0 }}
                    title="Excluir"
                  >
                    <FaTrash size={20} color="#ea3140" />
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() =>
                    handleToggleComplete(item.id, item.completed || false)
                  }
                  style={{ background: "transparent", border: 0 }}
                >
                  {item.completed ? (
                    <FaCheckCircle size={24} color="#00e676" />
                  ) : (
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        border: "2px solid #555",
                      }}
                    />
                  )}
                </button>
                <p
                  style={{
                    color: "#FFF",
                    fontSize: "1.1rem",
                    textDecoration: item.completed ? "line-through" : "none",
                    opacity: item.completed ? 0.5 : 1,
                  }}
                >
                  {item.tarefa}
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Modal de Limite Atingido */}
      {showLimitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Limite Atingido!</h2>
            <p>
              Você atingiu o limite de 50 tarefas gratuitas da sua conta. Para
              continuar adicionando novas tarefas sem restrições, adquira o
              acesso ilimitado.
            </p>
            <div className={styles.modalActions}>
              <Link
                href="https://seulinkdepagamento.com.br"
                target="_blank"
                className={styles.linkBuy}
              >
                Desbloquear Acesso Ilimitado
              </Link>
              <button
                onClick={() => setShowLimitModal(false)}
                className={styles.buttonClose}
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer autoClose={3000} theme="colored" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (!session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        email: session.user.email,
      },
    },
  };
};
