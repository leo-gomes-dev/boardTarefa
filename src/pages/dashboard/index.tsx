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

// biblioteca de Toast "mensagens"
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
  const [priority, setPriority] = useState("low");
  const [filter, setFilter] = useState("all");

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
          const data = doc.data(); // Captura os dados para facilitar o acesso

          lista.push({
            id: doc.id,
            tarefa: data.tarefa,
            created: data.created,
            user: data.user,
            public: data.public,
            completed: data.completed || false,
            // ADICIONE A LINHA ABAIXO:
            priority: data.priority || "baixa",
          });
        });

        setTasks(lista);
      });
    }

    loadTarefas();
  }, [user?.email]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  // Adicione este estado ao seu componente

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if (input === "") return;

    try {
      if (editingTaskId) {
        const docRef = doc(db, "tarefas", editingTaskId);
        await updateDoc(docRef, {
          tarefa: input,
          public: publicTask,
          priority: priority, // Atualiza a prioridade ao editar
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
          priority: priority, // Salva a prioridade selecionada
        });
        toast.success("Tarefa registrada!");
      }
      setInput("");
      setPriority("low"); // Reseta para o padrão
    } catch (err) {
      console.log(err);
    }
  }

  // Lógica de filtragem e classificação por prioridade
  const filteredTasks = tasks
    .filter((item) => {
      if (filter === "completed") return item.completed === true;
      if (filter === "pending") return item.completed === false;
      return true; // "all"
    })
    .sort((a, b) => {
      // Definimos explicitamente que as chaves são as strings permitidas
      const pesos: { [key in "baixa" | "media" | "alta"]: number } = {
        alta: 3,
        media: 2,
        baixa: 1,
      };

      // Usamos o operador de coalescência (??) para garantir um valor numérico caso venha vazio
      const pesoA = pesos[a.priority as keyof typeof pesos] ?? 0;
      const pesoB = pesos[b.priority as keyof typeof pesos] ?? 0;

      return pesoB - pesoA;
    });

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
    toast.info("URL Copiada com sucesso!");
  }

  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPublicTask(item.public);
    setPriority(item.priority || "baixa"); // Carrega a prioridade existente
    setEditingTaskId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    const docRef = doc(db, "tarefas", id);
    await updateDoc(docRef, {
      completed: !completed,
    });
  }

  // NOVA LÓGICA DE DELETAR COM DESFAZER
  const handleDeleteTask = async (task: TaskProps) => {
    let isUndone = false; // Controle local simples

    const toastId = toast.info(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <span>Tarefa removida</span>
        <button
          onClick={() => {
            isUndone = true; // Marca que o usuário clicou em desfazer
            toast.dismiss(toastId); // Fecha este toast
          }}
          style={{
            background: "#FFF",
            color: "#3183ff",
            border: "none",
            padding: "4px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            marginLeft: "10px",
            fontWeight: "bold",
          }}
        >
          Desfazer
        </button>
      </div>,
      {
        autoClose: 4000,
        closeOnClick: false, // Evita fechar o toast ao clicar na barra, forçando o uso do botão
        onClose: async () => {
          if (isUndone) {
            // Se o usuário clicou em desfazer, apenas avisamos e NÃO deletamos do banco
            toast.success("Ação desfeita!", {
              toastId: "undo-success", // ID fixo evita duplicatas se clicar rápido
              autoClose: 2000,
            });
          } else {
            // Se o tempo acabou e NÃO foi clicado em desfazer, deleta permanentemente
            try {
              const docRef = doc(db, "tarefas", task.id);
              await deleteDoc(docRef);
            } catch (err) {
              console.error("Erro ao deletar:", err);
            }
          }
        },
      }
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            {/* CONTAINER DO TÍTULO + BOTÃO SAIR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <h1 className={styles.title} style={{ margin: 0 }}>
                {editingTaskId ? "Editando sua tarefa" : "Qual sua tarefa?"}
              </h1>

              <button
                onClick={() => signOut()}
                style={{
                  backgroundColor: "#ea3140",
                  color: "#FFF",
                  padding: "6px 16px",
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
                placeholder="Digite qual sua tarefa..."
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(event.target.value)
                }
              />

              <div className={styles.priorityArea} style={{ margin: "15px 0" }}>
                <label
                  style={{ marginRight: 10, fontWeight: "bold", color: "#fff" }}
                >
                  Prioridade:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.selectPriority}
                  style={{ padding: "5px", borderRadius: "4px" }}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className={styles.checkboxArea}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                />
                <label style={{ color: "#fff" }}>Deixar tarefa pública?</label>
              </div>

              <button className={styles.button} type="submit">
                {editingTaskId ? "Salvar Alterações" : "Registrar"}
              </button>

              {editingTaskId && (
                <button
                  type="button"
                  className={styles.button}
                  style={{ backgroundColor: "#888", marginTop: 10 }}
                  onClick={() => {
                    setEditingTaskId(null);
                    setInput("");
                    setPublicTask(false);
                    setPriority("baixa");
                  }}
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          {/* Filtros de Tarefas */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h1>Minhas tarefas</h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: filter === "all" ? "#3183ff" : "#eee",
                  color: filter === "all" ? "#fff" : "#000",
                  border: "none",
                }}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter("completed")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: filter === "completed" ? "#3183ff" : "#eee",
                  color: filter === "completed" ? "#fff" : "#000",
                  border: "none",
                }}
              >
                Concluídas
              </button>
            </div>
          </div>

          {filteredTasks.map((item) => (
            <article key={item.id} className={styles.task}>
              <div className={styles.tagContainer}>
                <label
                  className={styles.tag}
                  style={{
                    backgroundColor:
                      item.priority === "alta"
                        ? "#ea3140"
                        : item.priority === "media"
                        ? "#f1c40f"
                        : "#3183ff",
                    marginRight: 8,
                  }}
                >
                  {item.priority.toUpperCase()}
                </label>

                {item.public && (
                  <>
                    <label className={styles.tag}>PÚBLICO</label>
                    <button
                      className={styles.shareButton}
                      onClick={() => handleShare(item.id)}
                    >
                      <FiShare2 size={22} color="#3183ff" />
                    </button>
                  </>
                )}

                <button
                  style={{
                    background: "transparent",
                    border: 0,
                    marginLeft: 10,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    handleToggleComplete(item.id, !!item.completed)
                  }
                >
                  <FaCheckCircle
                    size={22}
                    color={item.completed ? "#2ecc71" : "#CCC"}
                  />
                </button>
              </div>

              <div className={styles.taskContent}>
                <div
                  style={{
                    textDecoration: item.completed ? "line-through" : "none",
                    opacity: item.completed ? 0.6 : 1,
                    flex: 1,
                  }}
                >
                  {item.public ? (
                    <Link href={`/task/${item.id}`}>
                      <p>{item.tarefa}</p>
                    </Link>
                  ) : (
                    <p>{item.tarefa}</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <button
                    style={{
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit size={24} color="#3183ff" />
                  </button>
                  <button
                    className={styles.trashButton}
                    onClick={() => handleDeleteTask(item)}
                  >
                    <FaTrash size={24} color="#ea3140" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <ToastContainer />
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
        email: session?.user?.email,
      },
    },
  };
};
