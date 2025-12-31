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
  const [showThanksModal, setShowThanksModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const isAdmin = user?.email === "leogomdesenvolvimento@gmail.com";

  // ----- Monitoramento de Plano em Tempo Real (Solução para Pix) -----
  useEffect(() => {
    if (!user?.email) return;
    const userRef = doc(db, "users", user.email);

    const unsubPlan = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const plan = data.plano || "Free";

        const hasPremium =
          plan === "Premium Anual" || plan === "Enterprise 36 Meses" || isAdmin;
        const hasEnterprise = plan === "Enterprise 36 Meses" || isAdmin;

        // Se o status mudou para premium agora (via Webhook), dispara o modal
        if (!isPremium && hasPremium && data.status === "premium") {
          setShowThanksModal(true);
        }

        setIsPremium(hasPremium);
        setIsEnterprise(hasEnterprise);
      }
    });

    return () => unsubPlan();
  }, [user?.email, isAdmin, isPremium]);

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

  // Captura retorno do Mercado Pago (Cartão e Pix via Redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const paymentId =
      urlParams.get("payment_id") || urlParams.get("preference_id");

    if (paymentId) {
      const alreadyShown = localStorage.getItem(`thanks_${paymentId}`);

      // Só mostra se for aprovado e se ainda não foi mostrado para este ID
      if (status === "approved" && !alreadyShown) {
        setShowThanksModal(true);
        localStorage.setItem(`thanks_${paymentId}`, "true");
      }

      // LIMPEZA OBRIGATÓRIA: Remove os parâmetros da URL para o F5 não repetir a lógica
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, []);

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

  const filteredTasks = tasks
    .filter((item) => {
      if (!isEnterprise && !isAdmin) return true;
      if (filter === "completed") return item.completed === true;
      if (filter === "pending") return item.completed === false;
      return true;
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel - OrganizaTask 2026</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
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
                      const prev = filter;
                      setFilter("all");
                      setTimeout(() => {
                        window.print();
                        setFilter(prev);
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

            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="O que vamos fazer hoje?"
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
              />
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
                {isEnterprise && (
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
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <p
                    style={{
                      textDecoration: item.completed ? "line-through" : "none",
                      margin: 0,
                      fontWeight: "500",
                      color: "#000",
                      flex: 1,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.tarefa}
                  </p>
                  {item.public && isEnterprise && (
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#27ae60",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
                {isEnterprise && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.public}
                      onChange={(e) =>
                        updateDoc(doc(db, "tarefas", item.id), {
                          public: e.target.checked,
                        })
                      }
                    />
                    <label style={{ fontSize: "12px", color: "#333" }}>
                      Deixar Pública
                    </label>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "5px",
                  }}
                >
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
                          if (!item.public) {
                            toast.warn(
                              isEnterprise
                                ? "Marque como pública para compartilhar!"
                                : "Requer Plano Enterprise!"
                            );
                            return;
                          }
                          navigator.clipboard.writeText(
                            window.location.origin + "/task/" + item.id
                          );
                          toast.success("Link copiado!");
                        },
                        "Compartilhamento",
                        "premium"
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: isEnterprise ? "pointer" : "not-allowed",
                      opacity: isEnterprise ? 1 : 0.4,
                    }}
                  >
                    <FiShare2
                      size={20}
                      color={
                        item.public && isEnterprise ? "#27ae60" : "#3183ff"
                      }
                    />
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
      {showThanksModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1d1d2e",
              padding: "40px",
              borderRadius: "15px",
              textAlign: "center",
              maxWidth: "450px",
              border: "2px solid #3183ff",
            }}
          >
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>☕</div>
            <h2 style={{ color: "#FFF", marginBottom: "15px" }}>
              Obrigado por me pagar um café!
            </h2>
            <p
              style={{ color: "#ccc", lineHeight: "1.6", marginBottom: "25px" }}
            >
              Seu apoio mantém o <strong>OrganizaTask 2026</strong> ativo. Seu
              plano já foi ativado!
            </p>
            <button
              onClick={() => setShowThanksModal(false)}
              style={{
                backgroundColor: "#3183ff",
                color: "#FFF",
                padding: "12px 30px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Começar a usar
            </button>
          </div>
        </div>
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
