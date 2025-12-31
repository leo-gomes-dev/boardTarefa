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
  const [priority, setPriority] = useState("baixa");
  const [filter, setFilter] = useState("all");
  const [showLimitModal, setShowLimitModal] = useState(false);

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

    // 1. Feedback de campo vazio
    if (input.trim() === "") {
      toast.warn("Por favor, digite uma tarefa antes de registrar!");
      return;
    }

    try {
      if (editingTaskId) {
        // Lógica de Edição (Não tem limite)
        const docRef = doc(db, "tarefas", editingTaskId);
        await updateDoc(docRef, {
          tarefa: input,
          public: publicTask,
          priority: priority,
        });
        setEditingTaskId(null);
        toast.success("Tarefa atualizada!");
      } else {
        // 2. Verificação de Limite para NOVAS tarefas
        if (tasks.length >= 50) {
          setShowLimitModal(true); // Abre o modal sinalizando o limite
          return; // Interrompe o registro
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

      // Limpa os campos após sucesso
      setInput("");
      setPriority("baixa");
      setPublicTask(false);
    } catch (err) {
      console.log(err);
      toast.error("Erro ao salvar tarefa.");
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
            // Se o tempo acabou e NÃO foi clicado em desfazer, deletar permanente
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

              {/* Área de Prioridade e Checkbox */}
              <div className={styles.priorityArea} style={{ margin: "15px 0" }}>
                <label
                  style={{ marginRight: 10, fontWeight: "bold", color: "#fff" }}
                >
                  Prioridade:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ padding: "5px", borderRadius: "4px" }}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div
                style={{
                  marginBottom: 15,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={publicTask}
                  onChange={handleChangePublic}
                  id="public-check"
                />
                <label
                  htmlFor="public-check"
                  style={{ color: "#fff", marginLeft: 8, cursor: "pointer" }}
                >
                  Deixar tarefa pública?
                </label>
              </div>

              {/* BOTÃO PRINCIPAL */}
              <button
                className={styles.button}
                type="submit"
                style={{
                  backgroundColor:
                    !editingTaskId && tasks.length >= 50 ? "#444" : "#3183ff",
                  cursor:
                    !editingTaskId && tasks.length >= 50
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {editingTaskId ? "Salvar Alterações" : "Registrar Tarefa"}
              </button>

              {/* BOTÃO CANCELAR - Forçamos a exibição se houver ID de edição */}
              {editingTaskId !== null && (
                <button
                  type="button"
                  className={styles.button}
                  style={{
                    backgroundColor: "#ea3140",
                    marginTop: 10,
                    display: "block",
                    width: "100%",
                  }}
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

              {/* CONTADOR DE TAREFAS - Fora de qualquer condição para sempre aparecer */}
              <p
                style={{
                  color: tasks.length >= 50 ? "#ea3140" : "#ccc",
                  fontSize: "14px",
                  marginTop: "15px",
                  textAlign: "center",
                  fontWeight: tasks.length >= 50 ? "bold" : "normal",
                  display: "block", // Garante que não seja ocultado por algum flex mal configurado
                }}
              >
                {tasks.length} / 50 tarefas utilizadas
              </p>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h1>Tarefas</h1>
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

      {/* MODAL DE LIMITE (Faltava este bloco no final para 2026) */}
      {showLimitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ color: "#FFF" }}>Atenção! 🚀</h2>
            <p style={{ color: "#ccc", margin: "20px 0" }}>
              Você atingiu o limite máximo de 50 tarefas da sua conta gratuita.
              Mude para a <strong>Versão Premium</strong> e tenha escrita
              ilimitada para organizar toda sua rotina!
            </p>

            <div
              className={styles.modalActions}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <Link
                href="https://seulinkdepagamento.com.br"
                target="_blank"
                className={styles.linkBuy}
                style={{
                  backgroundColor: "#2ecc71", // Cor verde para destacar "Compra"
                  padding: "15px",
                  borderRadius: "4px",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                QUERO ACESSO ILIMITADO AGORA
              </Link>

              <button
                onClick={() => setShowLimitModal(false)}
                className={styles.buttonClose}
              >
                Continuar com 50 tarefas
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer autoClose={3000} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  if (!session?.user) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { user: { email: session?.user?.email } } };
};
