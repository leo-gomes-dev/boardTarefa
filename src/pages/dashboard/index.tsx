import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";

// Componentes e Ícones
import { Textarea } from "../../components/textarea";
import { FiShare2, FiSettings } from "react-icons/fi";
import { FaTrash, FaEdit, FaCheckCircle, FaFilePdf } from "react-icons/fa";
import { LimitModal } from "@/components/modal/LimitModal";
import { UpgradeModal } from "@/components/modal/UpgradeModal";

// Firebase
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
  serverTimestamp,
} from "firebase/firestore";

interface TaskProps {
  id: string;
  created: Date;
  public: boolean;
  tarefa: string;
  user: string;
  completed?: boolean;
  priority: "baixa" | "media" | "alta";
}

export default function Dashboard({ user }: { user: { email: string } }) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [priority, setPriority] = useState<"baixa" | "media" | "alta">("baixa");
  const [filter, setFilter] = useState("all");

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState("");

  const [isPremium, setIsPremium] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const isAdmin = user?.email === "leogomdesenvolvimento@gmail.com";

  // ----- Verificação de Planos -----
  useEffect(() => {
    async function checkPlan() {
      if (!user?.email) return;
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const plan = data.plano || "Free";
        setIsPremium(
          plan === "Premium Anual" ||
            plan === "Professional Max" ||
            plan === "Enterprise 36 Meses" ||
            isAdmin
        );
        setIsEnterprise(
          plan === "Professional Max" ||
            plan === "Enterprise 36 Meses" ||
            isAdmin
        );
      }
    }
    checkPlan();
  }, [user?.email, isAdmin]);

  // ----- Busca de Tarefas e Contagem -----
  useEffect(() => {
    if (!user?.email) return;

    const qCount = query(
      collection(db, "tarefas"),
      where("user", "==", user.email)
    );
    const unsubCount = onSnapshot(qCount, (snapshot) =>
      setTotalCount(snapshot.size)
    );

    const q = query(
      collection(db, "tarefas"),
      where("user", "==", user.email),
      orderBy("created", "desc")
    );
    const unsubTasks = onSnapshot(q, (snapshot) => {
      const lista: TaskProps[] = [];
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
    });

    return () => {
      unsubCount();
      unsubTasks();
    };
  }, [user?.email]);

  // ----- Bloqueio por Plano -----
  function handleActionGuard(
    action: () => void,
    feature: string,
    requiredLevel: "premium" | "enterprise"
  ) {
    const hasAccess = requiredLevel === "premium" ? isPremium : isEnterprise;
    if (!hasAccess && !isAdmin) {
      setActiveFeature(feature);
      setShowUpgradeModal(true);
      return;
    }
    action();
  }

  // ----- Registro/Atualização de Tarefas -----
  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if (!isPremium && totalCount >= 30 && !editingTaskId && !isAdmin) {
      setShowLimitModal(true);
      return;
    }
    if (!input.trim()) {
      toast.warn("Digite uma tarefa");
      return;
    }
    try {
      if (editingTaskId) {
        await updateDoc(doc(db, "tarefas", editingTaskId), {
          tarefa: input,
          public: publicTask,
          priority,
        });
        setEditingTaskId(null);
        toast.success("Tarefa atualizada!");
      } else {
        await addDoc(collection(db, "tarefas"), {
          tarefa: input,
          created: serverTimestamp(),
          user: user.email,
          public: publicTask,
          completed: false,
          priority,
        });
        toast.success("Tarefa registrada!");
      }
      setInput("");
      setPublicTask(false);
      setPriority("baixa");
    } catch {
      toast.error("Erro ao salvar.");
    }
  }

  // ----- Deletar Tarefas -----
  const handleDeleteTask = async (item: TaskProps) => {
    let isUndone = false;
    const toastId = toast.info(
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <span>Excluir tarefa?</span>
        <button
          onClick={() => {
            isUndone = true;
            toast.dismiss(toastId);
          }}
          style={{
            background: "#FFF",
            color: "#3183ff",
            border: "none",
            padding: "4px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Desfazer
        </button>
      </div>,
      {
        autoClose: 4000,
        closeOnClick: false,
        onClose: async () => {
          if (!isUndone) await deleteDoc(doc(db, "tarefas", item.id));
        },
      }
    );
  };

  // ----- Filtros e Paginação -----
  const filteredTasks = tasks
    .filter((item) => {
      if (!isEnterprise && !isAdmin) return true;
      if (filter === "completed") return item.completed === true;
      if (filter === "pending") return item.completed === false;
      return true;
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime()); // Mais recentes no topo

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel - OrganizaTask 2026</title>
      </Head>
      <main className={styles.main}>
        {/* FORMULÁRIO DE TAREFAS */}
        <section className={styles.content}>
          <div className={styles.contentForm}>
            {/* Header com PDF/Config */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h1 className={styles.title}>Painel</h1>
              <div style={{ display: "flex", gap: "10px" }}>
                {isEnterprise && (
                  <button
                    onClick={() => {
                      document.body.classList.add("print-mode");
                      const prevFilter = filter;
                      setFilter("all");
                      setTimeout(() => {
                        window.print();
                        setFilter(prevFilter);
                        document.body.classList.remove("print-mode");
                      }, 300);
                    }}
                    style={{
                      backgroundColor: "#ea3140",
                      color: "#FFF",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FaFilePdf size={16} /> Exportar PDF
                  </button>
                )}
                {isAdmin && (
                  <Link
                    href="/config"
                    style={{
                      backgroundColor: "#3183ff",
                      color: "#FFF",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FiSettings size={16} /> Configurações
                  </Link>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="O que vamos fazer hoje?"
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
              />
              {/* Prioridade / Checkbox */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "15px",
                  marginTop: "15px",
                }}
              >
                {(isPremium || isAdmin) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="public_check"
                      checked={publicTask}
                      onChange={(e) => setPublicTask(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor="public_check"
                      style={{
                        color: "#FFF",
                        cursor: "pointer",
                        fontSize: "15px",
                      }}
                    >
                      Deixar Pública
                    </label>
                  </div>
                )}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {["baixa", "media", "alta"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        p === "baixa"
                          ? setPriority(p as any)
                          : handleActionGuard(
                              () => setPriority(p as any),
                              "Prioridades",
                              "premium"
                            )
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "15px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px",
                        border: `1px solid ${
                          p === "alta"
                            ? "#ea3140"
                            : p === "media"
                            ? "#ff9b2d"
                            : "#27ae60"
                        }`,
                        background:
                          priority === p
                            ? p === "alta"
                              ? "#ea3140"
                              : p === "media"
                              ? "#ff9b2d"
                              : "#27ae60"
                            : "transparent",
                        color:
                          priority === p
                            ? "#FFF"
                            : p === "alta"
                            ? "#ea3140"
                            : p === "media"
                            ? "#ff9b2d"
                            : "#27ae60",
                        opacity:
                          !isPremium && p !== "baixa" && !isAdmin ? 0.4 : 1,
                      }}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.button}
                type="submit"
                style={{
                  marginTop: "15px",
                  opacity:
                    !isPremium && totalCount >= 30 && !editingTaskId && !isAdmin
                      ? 0.7
                      : 1,
                }}
              >
                {!isPremium && totalCount >= 30 && !editingTaskId && !isAdmin
                  ? "LIMITE ATINGIDO (VER PLANOS)"
                  : editingTaskId
                  ? "SALVAR TAREFA"
                  : "ADICIONAR TAREFA"}
              </button>
            </form>
          </div>
        </section>

        {/* LISTA DE TAREFAS */}
        <section className={styles.taskContainer}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2>Minhas tarefas ({totalCount})</h2>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginTop: "15px",
                opacity: isEnterprise || isAdmin ? 1 : 0.5,
              }}
            >
              {[
                { id: "all", label: "TODAS" },
                { id: "pending", label: "PENDENTES" },
                { id: "completed", label: "CONCLUÍDAS" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    handleActionGuard(
                      () => setFilter(f.id),
                      "Filtros",
                      "enterprise"
                    )
                  }
                  style={{
                    padding: "6px 15px",
                    borderRadius: "20px",
                    border: "1px solid #3183ff",
                    cursor: "pointer",
                    background: filter === f.id ? "#3183ff" : "transparent",
                    color: filter === f.id ? "#FFF" : "#3183ff",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {currentTasks.map((item) => (
            <article
              key={item.id}
              className={styles.task}
              style={{
                marginBottom: "15px",
                padding: "20px",
                background: "#FFF",
                borderRadius: "8px",
                borderLeft: `5px solid ${
                  item.priority === "alta"
                    ? "#ea3140"
                    : item.priority === "media"
                    ? "#ff9b2d"
                    : "#27ae60"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      textDecoration: item.completed ? "line-through" : "none",
                      margin: 0,
                      fontWeight: "500",
                      color: "#000",
                    }}
                  >
                    {item.tarefa}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() =>
                      updateDoc(doc(db, "tarefas", item.id), {
                        completed: !item.completed,
                      })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <FaCheckCircle
                      size={22}
                      color={item.completed ? "#27ae60" : "#5c5c5c"}
                    />
                  </button>
                  <button
                    onClick={() =>
                      handleActionGuard(
                        () => {
                          setInput(item.tarefa);
                          setEditingTaskId(item.id);
                          setPriority(item.priority);
                          setPublicTask(item.public);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        },
                        "Edição",
                        "premium"
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      opacity: isPremium || isAdmin ? 1 : 0.3,
                    }}
                  >
                    <FaEdit size={20} color="#3183ff" />
                  </button>
                  <button
                    onClick={() =>
                      handleActionGuard(
                        () => {
                          navigator.clipboard.writeText(
                            window.location.origin + "/task/" + item.id
                          );
                          toast.info("Link copiado!");
                        },
                        "Compartilhamento",
                        "premium"
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      opacity: isPremium || isAdmin ? 1 : 0.3,
                    }}
                  >
                    <FiShare2 size={20} color="#3183ff" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(item)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <FaTrash size={20} color="#ea3140" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {/* PAGINAÇÃO */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  border: "1px solid #3183ff",
                  backgroundColor: currentPage === 1 ? "#4b4b4b" : "#3183ff",
                  color: "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Anterior
              </button>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#fff",
                }}
              >
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  border: "1px solid #3183ff",
                  backgroundColor:
                    currentPage === totalPages ? "#4b4b4b" : "#3183ff",
                  color: "#fff",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Próximo
              </button>
            </div>
          )}
        </section>
      </main>

      {showLimitModal && (
        <LimitModal closeModal={() => setShowLimitModal(false)} />
      )}
      {showUpgradeModal && (
        <UpgradeModal
          featureName={activeFeature}
          closeModal={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  if (!session?.user)
    return { redirect: { destination: "/", permanent: false } };
  return { props: { user: { email: session.user.email } } };
};
