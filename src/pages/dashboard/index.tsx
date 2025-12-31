import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2, FiSettings, FiPlusCircle } from "react-icons/fi";
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
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import Link from "next/link";

import { toast } from "react-toastify";
import { LimitModal } from "@/components/modal/LimitModal";

interface HomeProps {
  user: { email: string };
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
  const [totalCount, setTotalCount] = useState(0); // Estado para o contador total

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isAdmin = user?.email === "leogomdesenvolvimento@gmail.com";

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

    // Snapshot para o contador total em tempo real
    const qCount = query(
      collection(db, "tarefas"),
      where("user", "==", user.email)
    );
    const unsubCount = onSnapshot(qCount, (snapshot) => {
      setTotalCount(snapshot.size);
    });

    // Query principal com ordenação (Novas no Topo) e limite inicial
    const q = query(
      collection(db, "tarefas"),
      where("user", "==", user.email),
      orderBy("created", "desc"),
      limit(15)
    );

    const unsubTasks = onSnapshot(q, (snapshot) => {
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
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length >= 15);

      if (!isPremium && snapshot.size >= 30) setShowLimitModal(true);
    });

    return () => {
      unsubCount();
      unsubTasks();
    };
  }, [user?.email, isPremium]);

  async function handleLoadMore() {
    if (!lastVisible || loadingMore) return;
    setLoadingMore(true);

    const q = query(
      collection(db, "tarefas"),
      where("user", "==", user.email),
      orderBy("created", "desc"),
      startAfter(lastVisible),
      limit(15)
    );

    const querySnapshot = await getDocs(q);
    const lista = [] as TaskProps[];

    querySnapshot.forEach((doc) => {
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

    if (lista.length > 0) {
      setTasks((prevTasks) => [...prevTasks, ...lista]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length >= 15);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if (input.trim() === "") {
      toast.warn("Preencha a tarefa!");
      return;
    }
    try {
      if (editingTaskId) {
        await updateDoc(doc(db, "tarefas", editingTaskId), {
          tarefa: input,
          public: publicTask,
          priority: priority,
          user: user.email,
        });
        setEditingTaskId(null);
        toast.success("Tarefa atualizada!");
      } else {
        await addDoc(collection(db, "tarefas"), {
          tarefa: input,
          created: new Date(),
          user: user.email,
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
      toast.error("Erro ao salvar no banco.");
    }
  }

  const filteredTasks = tasks.filter((item) => {
    if (filter === "completed") return item.completed === true;
    if (filter === "pending") return item.completed === false;
    return true;
  });

  const handleDeleteTask = async (item: TaskProps) => {
    let isUndone = false;
    const toastId = toast.info(
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
          if (!isUndone) {
            await deleteDoc(doc(db, "tarefas", item.id));
          } else {
            toast.success("Ação desfeita!");
          }
        },
      }
    );
  };

  async function handleToggleComplete(id: string, completed: boolean) {
    await updateDoc(doc(db, "tarefas", id), { completed: !completed });
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/task/${id}`);
    toast.info("URL Copiada!");
  }

  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPriority(item.priority);
    setPublicTask(item.public);
    setEditingTaskId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - OrganizaTask 2026</title>
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
              <h1 className={styles.title} style={{ margin: 0 }}>
                Dashboard
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
                    fontSize: "12px",
                  }}
                >
                  <FiSettings size={16} /> Configurações
                </Link>
              )}
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <input
                    type="checkbox"
                    id="public_check"
                    checked={publicTask}
                    onChange={(e) => setPublicTask(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {["baixa", "media", "alta"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p as any)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "15px",
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
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "0.3s",
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
                style={{ marginTop: "20px" }}
              >
                {editingTaskId ? "SALVAR TAREFA" : "ADICIONAR TAREFA"}
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "30px",
              width: "100%",
            }}
          >
            <h2
              style={{ color: "#333", marginBottom: "15px", fontSize: "22px" }}
            >
              Minhas tarefas ({totalCount})
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {[
                { id: "all", label: "TODAS" },
                { id: "pending", label: "PENDENTES" },
                { id: "completed", label: "CONCLUÍDAS" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "25px",
                    border: "1px solid #3183ff",
                    background: filter === f.id ? "#3183ff" : "transparent",
                    color: filter === f.id ? "#FFF" : "#3183ff",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.map((item) => (
            <article
              key={item.id}
              className={styles.task}
              style={{
                opacity: item.completed ? 0.6 : 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className={styles.tagContainer}
                style={{ display: "flex", gap: "8px", marginBottom: "15px" }}
              >
                {item.public && <label className={styles.tag}>PÚBLICA</label>}
                <label
                  className={styles.tag}
                  style={{
                    backgroundColor:
                      item.priority === "alta"
                        ? "#ea3140"
                        : item.priority === "media"
                        ? "#ff9b2d"
                        : "#27ae60",
                  }}
                >
                  {item.priority.toUpperCase()}
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "20px",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1, minWidth: "250px" }}>
                  {item.public ? (
                    <Link
                      href={`/task/${item.id}`}
                      style={{ textDecoration: "none", color: "#000" }}
                    >
                      <p
                        style={{
                          margin: 0,
                          textDecoration: item.completed
                            ? "line-through"
                            : "none",
                          wordBreak: "break-word",
                          fontWeight: "500",
                          fontSize: "16px",
                        }}
                      >
                        {item.tarefa}
                      </p>
                    </Link>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        textDecoration: item.completed
                          ? "line-through"
                          : "none",
                        wordBreak: "break-word",
                        fontWeight: "500",
                        fontSize: "16px",
                      }}
                    >
                      {item.tarefa}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() =>
                      handleToggleComplete(item.id, item.completed || false)
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
                    onClick={() => handleEdit(item)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <FaEdit size={20} color="#3183ff" />
                  </button>
                  <button
                    onClick={() => handleShare(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
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

          {hasMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "30px",
              }}
            >
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#3183ff",
                  color: "#FFF",
                  border: "none",
                  padding: "10px 30px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "0.3s",
                }}
              >
                <FiPlusCircle />{" "}
                {loadingMore ? "Processando..." : "CARREGAR MAIS"}
              </button>
            </div>
          )}
        </section>
      </main>

      {showLimitModal && (
        <LimitModal closeModal={() => setShowLimitModal(false)} />
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
