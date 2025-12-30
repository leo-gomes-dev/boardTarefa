import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
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
}

export default function Dashboard({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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
          lista.push({
            id: doc.id,
            tarefa: doc.data().tarefa,
            created: doc.data().created,
            user: doc.data().user,
            public: doc.data().public,
            completed: doc.data().completed || false,
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

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input === "") return;

    try {
      if (editingTaskId) {
        const docRef = doc(db, "tarefas", editingTaskId);
        await updateDoc(docRef, {
          tarefa: input,
          public: publicTask,
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
        });
        toast.success("Tarefa registrada!");
      }

      setInput("");
      setPublicTask(false);
    } catch (err) {
      console.log(err);
      toast.error("Erro ao salvar tarefa.");
    }
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
    toast.info("URL Copiada com sucesso!");
  }

  function handleEdit(item: TaskProps) {
    setInput(item.tarefa);
    setPublicTask(item.public);
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
    let undone = false;

    const toastId = toast.info(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Tarefa removida</span>
        <button
          onClick={() => {
            undone = true;
            toast.dismiss(toastId);
          }}
          style={{
            background: "#3183ff",
            color: "#fff",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          Desfazer
        </button>
      </div>,
      {
        autoClose: 4000,
        onClose: async () => {
          if (!undone) {
            const docRef = doc(db, "tarefas", task.id);
            await deleteDoc(docRef);
          } else {
            toast.success("Ação desfeita com sucesso!");
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
            <h1 className={styles.title}>
              {editingTaskId ? "Editando sua tarefa" : "Qual sua tarefa?"}
            </h1>

            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="Digite qual sua tarefa..."
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(event.target.value)
                }
              />
              <div className={styles.checkboxArea}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                />
                <label>Deixar tarefa pública?</label>
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
                  }}
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <h1>Minhas tarefas</h1>

          {tasks.map((item) => (
            <article key={item.id} className={styles.task}>
              <div className={styles.tagContainer}>
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
