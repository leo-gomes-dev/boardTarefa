import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2 } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";

import { db } from "../../services/firebaseConnection";

import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  where,
} from "firebase/firestore";
import Link from "next/link";

// Importando a formatação da data
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// NOVOS IMPORTS PARA UI/UX
import { toast } from "react-toastify";
import Swal from "sweetalert2";

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
}

export default function Admin({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [isPremium, setIsPremium] = useState(false); // Estado para o Plano

  useEffect(() => {
    async function loadTarefas() {
      // 1. Verifica se o usuário é Premium no Firebase
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().status === "premium") {
        setIsPremium(true);
      }

      // 2. Carrega as tarefas do usuário logado
      const tarefasRef = collection(db, "tarefas");
      const q = query(
        tarefasRef,
        orderBy("created", "desc"),
        where("user", "==", user.email) // Filtra para mostrar apenas as do usuário
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let lista: TaskProps[] = [];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            tarefa: doc.data().tarefa,
            created: doc.data().created.toDate(),
            user: doc.data().user,
            public: doc.data().public,
          });
        });

        setTasks(lista);
      });

      return () => unsubscribe();
    }

    loadTarefas();
  }, [user.email]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input === "") {
      toast.warn("Digite alguma tarefa!");
      return;
    }

    // LÓGICA DE BLOQUEIO 2026:
    // Se NÃO for premium e já tiver 30 ou mais tarefas, bloqueia.
    if (!isPremium && tasks.length >= 30) {
      toast.error(
        "Limite de 30 tarefas atingido! Faça upgrade para o Plano Premium."
      );
      return;
    }

    try {
      await addDoc(collection(db, "tarefas"), {
        tarefa: input,
        created: new Date(),
        user: user?.email,
        public: publicTask,
      });

      setInput("");
      setPublicTask(false);
      toast.success("Tarefa registrada com sucesso!");
    } catch (err) {
      console.log(err);
      toast.error("Erro ao registrar tarefa.");
    }
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/task/${id}`);
    toast.info("URL copiada com sucesso!");
  }

  const handleDeleteTask = async (id: string) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Você não poderá reverter esta ação!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea3140",
      cancelButtonColor: "#3183ff",
      confirmButtonText: "Sim, deletar!",
      cancelButtonText: "Cancelar",
      background: "#121212",
      color: "#fff",
    });

    if (result.isConfirmed) {
      const docRef = doc(db, "tarefas", id);
      try {
        await deleteDoc(docRef);
        toast.success("Tarefa deletada com sucesso!");
      } catch (err) {
        console.log("Erro ao deletar tarefa:", err);
        toast.error("Erro ao deletar tarefa.");
      }
    }
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
              Qual sua tarefa, {isPremium ? "Premium 👑" : "Free"}?
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
                  id="public_check"
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                />
                <label htmlFor="public_check">Deixar tarefa pública?</label>
              </div>

              <button
                className={styles.button}
                type="submit"
                disabled={!isPremium && tasks.length >= 30}
              >
                {!isPremium && tasks.length >= 30
                  ? "Limite Atingido"
                  : "Registrar"}
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <h1>Minhas tarefas ({tasks.length})</h1>

          {tasks.length === 0 ? (
            <p>Você ainda não tem tarefas registradas.</p>
          ) : (
            tasks.map((item) => (
              <article key={item.id} className={styles.task}>
                <div className={styles.tagContainer}>
                  {item.public && <label className={styles.tag}>PÚBLICO</label>}

                  <div className={styles.taskActions}>
                    <button
                      className={styles.shareButton}
                      onClick={() => handleShare(item.id)}
                    >
                      <FiShare2 size={22} color="#3183ff" />
                    </button>
                    <button
                      className={styles.trashButton}
                      onClick={() => handleDeleteTask(item.id)}
                    >
                      <FaTrash size={22} color="#ea3140" />
                    </button>
                  </div>
                </div>

                <div className={styles.taskContent}>
                  {item.public ? (
                    <Link href={`/task/${item.id}`}>
                      <p>{item.tarefa}</p>
                    </Link>
                  ) : (
                    <p>{item.tarefa}</p>
                  )}
                </div>

                <div className={styles.taskFooter}>
                  <span className={styles.createdAt}>
                    Em:{" "}
                    {format(item.created, "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
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
