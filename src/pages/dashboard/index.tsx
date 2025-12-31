import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";
import { useRouter } from "next/router"; // Importe o router

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

// ... Interfaces TaskProps e HomeProps mantêm-se iguais

export default function Dashboard({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [priority, setPriority] = useState("baixa");
  const [filter, setFilter] = useState("all");

  // CORREÇÃO 1: Começa como false para não travar o carregamento
  const [showLimitModal, setShowLimitModal] = useState(false);

  const router = useRouter(); // Hook para redirecionamento

  useEffect(() => {
    async function loadTarefas() {
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
            created: data.created,
            user: data.user,
            public: data.public,
            completed: data.completed || false,
            priority: data.priority || "baixa",
          });
        });

        setTasks(lista);

        // CORREÇÃO 2: Se o usuário atingir o limite, redireciona ou abre o modal
        if (lista.length >= 30) {
          // Se você quiser redirecionar IMEDIATAMENTE ao carregar:
          // router.push("/premium");

          // Ou apenas mostrar o modal:
          setShowLimitModal(true);
        } else {
          setShowLimitModal(false);
        }
      });

      return () => unsub(); // Limpa o snapshot ao desmontar
    }

    loadTarefas();
  }, [user?.email, router]);

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input.trim() === "") {
      toast.warn("Preencha a tarefa!");
      return;
    }

    // CORREÇÃO 3: Bloqueia apenas se for uma NOVA tarefa (!editingTaskId)
    // E redireciona para a página premium
    if (!editingTaskId && tasks.length >= 30) {
      toast.error("Limite de 30 tarefas atingido!");
      router.push("/premium"); // Redireciona para a página premium
      return;
    }

    // ... Lógica de salvamento que virá na Parte 2
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
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

              {/* BOTÃO PRINCIPAL COM LÓGICA DE PREMIUM */}
              <button
                className={styles.button}
                type="submit"
                style={{
                  backgroundColor:
                    !editingTaskId && tasks.length >= 30
                      ? "#f1c40f"
                      : "#3183ff",
                  color: !editingTaskId && tasks.length >= 30 ? "#000" : "#FFF",
                }}
              >
                {!editingTaskId && tasks.length >= 30
                  ? "Seja Premium para adicionar +"
                  : editingTaskId
                  ? "Salvar Alterações"
                  : "Registrar Tarefa"}
              </button>

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

              {/* CONTADOR COM LINK PARA PREMIUM */}
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <p
                  style={{
                    color: tasks.length >= 30 ? "#ea3140" : "#ccc",
                    fontSize: "14px",
                    fontWeight: tasks.length >= 30 ? "bold" : "normal",
                  }}
                >
                  {tasks.length} / 30 tarefas utilizadas
                </p>
                {tasks.length >= 30 && (
                  <Link
                    href="/premium"
                    style={{
                      color: "#f1c40f",
                      fontSize: "12px",
                      textDecoration: "underline",
                    }}
                  >
                    Aumentar meu limite agora!
                  </Link>
                )}
              </div>
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
              {/* Seus botões de filtro estão corretos */}
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

                {/* BOTÕES DE EDITAR E DELETAR (Verifique se estão no seu original) */}
                <div
                  style={{ marginLeft: "auto", display: "flex", gap: "10px" }}
                >
                  <button
                    style={{
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit size={20} color="#3183ff" />
                  </button>
                  <button
                    style={{
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleDeleteTask(item)}
                  >
                    <FaTrash size={20} color="#ea3140" />
                  </button>
                </div>
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
              </div>
            </article>
          ))}
        </section>
      </main>
      <ToastContainer />
    </div>
  );
}
