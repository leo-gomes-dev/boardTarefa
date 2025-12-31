import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2 } from "react-icons/fi";
import { FaTrash, FaEdit, FaCheckCircle, FaCrown } from "react-icons/fa";
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
  const [isPremium, setIsPremium] = useState(false); // Estado para controlar o Premium

  const router = useRouter();
  const { session_id } = router.query;

  // 1. Monitorar Status Premium e Notificação de Sucesso Stripe
  useEffect(() => {
    async function checkUserStatus() {
      if (!user?.email) return;

      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().status === "premium") {
        setIsPremium(true);
      }
    }

    checkUserStatus();

    // Notificação se acabou de voltar do Stripe
    if (session_id) {
      toast.success(
        "Assinatura Premium confirmada! Aproveite os recursos ilimitados. 🚀",
        {
          position: "top-center",
          autoClose: 6000,
        }
      );
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [user?.email, session_id, router]);

  // 2. Carregar Tarefas
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
          created: data.created,
          user: data.user,
          public: data.public,
          completed: data.completed || false,
          priority: data.priority || "baixa",
        });
      });

      setTasks(lista);

      // Lógica de bloqueio: se NÃO for premium e tiver 30 ou mais tarefas
      if (!isPremium && lista.length >= 30) {
        setShowLimitModal(true);
      } else {
        setShowLimitModal(false);
      }
    });

    return () => unsub();
  }, [user?.email, isPremium]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  // 3. Registro e Edição
  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input.trim() === "") {
      toast.warn("Preencha a tarefa!");
      return;
    }

    // Validação de Limite para usuários Free
    if (!isPremium && !editingTaskId && tasks.length >= 30) {
      toast.info("Você atingiu o limite de 30 tarefas do plano gratuito!");
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
      toast.error("Erro ao processar sua solicitação.");
    }
  }

  // 4. Deleção com "Desfazer"
  const handleDeleteTask = async (task: TaskProps) => {
    let isUndone = false;
    const toastId = toast.info(
      <div className={styles.undoContainer}>
        <span>Tarefa removida</span>
        <button
          onClick={() => {
            isUndone = true;
            toast.dismiss(toastId);
          }}
          className={styles.undoBtn}
        >
          Desfazer
        </button>
      </div>,
      {
        autoClose: 4000,
        closeOnClick: false,
        onClose: async () => {
          if (isUndone) {
            toast.success("Ação desfeita!");
          } else {
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

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas - OrganizaTask</title>
      </Head>

      <main className={styles.main}>
        {/* Banner de Diferenciação Premium */}
        {isPremium && (
          <div className={styles.premiumBanner}>
            <FaCrown color="#f1c40f" />{" "}
            <span>VOCÊ É PREMIUM: Tarefas ilimitadas liberadas!</span>
          </div>
        )}

        <section className={styles.content}>
          <div className={styles.contentForm}>
            <h1 className={styles.title}>Qual sua tarefa hoje?</h1>
            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="Digite qual sua tarefa..."
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

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.selectPriority}
                >
                  <option value="baixa">Baixa Prioridade</option>
                  <option value="media">Média Prioridade</option>
                  <option value="alta">Alta Prioridade</option>
                </select>
              </div>
              <button type="submit" className={styles.button}>
                {editingTaskId ? "Atualizar tarefa" : "Registrar"}
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
                {item.public && <span className={styles.tag}>PÚBLICA</span>}
                <span
                  className={`${styles.priorityTag} ${styles[item.priority]}`}
                >
                  {item.priority.toUpperCase()}
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
                    onClick={() =>
                      handleToggleComplete(item.id, item.completed!)
                    }
                  >
                    <FaCheckCircle
                      color={item.completed ? "#27ae60" : "#ccc"}
                      size={20}
                    />
                  </button>
                  <button onClick={() => handleEdit(item)}>
                    <FaEdit color="#3183ff" size={20} />
                  </button>
                  <button onClick={() => handleShare(item.id)}>
                    <FiShare2 color="#3183ff" size={20} />
                  </button>
                  <button onClick={() => handleDeleteTask(item)}>
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

  if (!session?.user) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return {
    props: {
      user: { email: session.user.email },
    },
  };
};
