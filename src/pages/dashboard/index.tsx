import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2 } from "react-icons/fi";
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
} from "firebase/firestore";
import Link from "next/link";

// biblioteca de Toast "mensagens"
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
  const [isPremium, setIsPremium] = useState(false); // Funcionalidade Premium

  const router = useRouter();
  const { session_id } = router.query;

  // Lógica funcional de verificação Premium
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

    if (session_id) {
      toast.success("Assinatura Premium ativada! 🚀");
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [user?.email, session_id, router]);

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

        // Bloqueio se não for premium (limite 30)
        if (!isPremium && lista.length >= 30) {
          setShowLimitModal(true);
        } else {
          setShowLimitModal(false);
        }
      });

      return () => unsub();
    }

    loadTarefas();
  }, [user?.email, isPremium]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input.trim() === "") {
      toast.warn("Preencha a tarefa!");
      return;
    }

    if (!isPremium && !editingTaskId && tasks.length >= 30) {
      setShowLimitModal(true);
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
      console.error("Erro ao salvar:", err);
    }
  }

  const filteredTasks = tasks
    .filter((item) => {
      if (filter === "completed") return item.completed === true;
      if (filter === "pending") return item.completed === false;
      return true;
    })
    .sort((a, b) => {
      const pesos: { [key in "baixa" | "media" | "alta"]: number } = {
        alta: 3,
        media: 2,
        baixa: 1,
      };
      const pesoA = pesos[a.priority as keyof typeof pesos] ?? 0;
      const pesoB = pesos[b.priority as keyof typeof pesos] ?? 0;
      return pesoB - pesoA;
    });

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
    toast.info("URL Copiada!");
  }

  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPublicTask(item.public);
    setPriority(item.priority || "baixa");
    setEditingTaskId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    const docRef = doc(db, "tarefas", id);
    await updateDoc(docRef, { completed: !completed });
  }

  const handleDeleteTask = async (task: TaskProps) => {
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
        <span>Tarefa removida</span>
        <button
          onClick={() => {
            isUndone = true;
            toast.dismiss(toastId);
          }}
          style={{
            background: "#FFF",
            color: "#3183ff",
            border: "none",
            padding: "4px 12px",
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
            try {
              const docRef = doc(db, "tarefas", task.id);
              await deleteDoc(docRef);
            } catch (err) {
              console.log(err);
            }
          } else {
            toast.success("Ação desfeita!");
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
            <h1 className={styles.title}>Qual sua tarefa hoje?</h1>
            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="Digite sua tarefa..."
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
              />
              <div className={styles.checkboxArea}>
                <label>
                  <input
                    type="checkbox"
                    checked={publicTask}
                    onChange={handleChangePublic}
                  />
                  <span>Deixar tarefa pública?</span>
                </label>
                {/* O select de prioridade foi mantido conforme seu código enviado inicialmente */}
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.selectPriority}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <button className={styles.button} type="submit">
                {editingTaskId ? "Atualizar" : "Registrar"}
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <h2>Minhas tarefas ({tasks.length})</h2>
          <div className={styles.filters}>
            <button
              onClick={() => setFilter("all")}
              className={filter === "all" ? styles.active : ""}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={filter === "pending" ? styles.active : ""}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={filter === "completed" ? styles.active : ""}
            >
              Concluídas
            </button>
          </div>

          {filteredTasks.map((item) => (
            <article
              key={item.id}
              className={`${styles.task} ${
                item.completed ? styles.taskCompleted : ""
              }`}
            >
              <div className={styles.tagContainer}>
                {item.public && <label className={styles.tag}>PÚBLICA</label>}
                <span
                  className={`${styles.priorityTag} ${styles[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>

              <div className={styles.taskContent}>
                {item.public ? (
                  <Link href={`/task/${item.id}`}>
                    <p>{item.tarefa}</p>
                  </Link>
                ) : (
                  <p>{item.tarefa}</p>
                )}
                <div className={styles.actions}>
                  <button
                    className={styles.trashButton}
                    onClick={() =>
                      handleToggleComplete(item.id, item.completed!)
                    }
                  >
                    <FaCheckCircle
                      color={item.completed ? "#27ae60" : "#ccc"}
                      size={20}
                    />
                  </button>
                  <button
                    className={styles.trashButton}
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit color="#3183ff" size={20} />
                  </button>
                  <button
                    className={styles.trashButton}
                    onClick={() => handleShare(item.id)}
                  >
                    <FiShare2 color="#3183ff" size={20} />
                  </button>
                  <button
                    className={styles.trashButton}
                    onClick={() => handleDeleteTask(item)}
                  >
                    <FaTrash color="#ea3140" size={20} />
                  </button>
                </div>
              </div>
            </article>
          ))}
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
