import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import styles from "./styles.module.css";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "../../components/textarea";
import { FiShare2, FiSettings, FiUser } from "react-icons/fi";
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

// UI/UX
import { toast } from "react-toastify";
import Swal from "sweetalert2";

interface HomeProps {
  user: {
    email: string;
    name?: string;
  };
}

interface TaskProps {
  id: string;
  created: Date;
  public: boolean;
  tarefa: string;
  user: string; // Email do autor
}

export default function Admin({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  // EMAIL DO ADMINISTRADOR
  const ADMIN_EMAIL = "leogomdesenvolvimento@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    async function loadTarefas() {
      // 1. Verifica status do plano
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().status === "premium") {
        setIsPremium(true);
      }

      // 2. Lógica de busca: Se for Admin, traz TUDO. Se não, traz só as dele.
      const tarefasRef = collection(db, "tarefas");
      let q;

      if (isAdmin) {
        // Busca global para o Admin controlar o sistema
        q = query(tarefasRef, orderBy("created", "desc"));
      } else {
        // Busca restrita ao usuário comum
        q = query(
          tarefasRef,
          orderBy("created", "desc"),
          where("user", "==", user.email)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let lista: TaskProps[] = [];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            tarefa: doc.data().tarefa,
            created: doc.data().created.toDate(),
            user: doc.data().user, // Email de quem cadastrou
            public: doc.data().public,
          });
        });

        setTasks(lista);
      });

      return () => unsubscribe();
    }

    loadTarefas();
  }, [user.email, isAdmin]);

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/task/${id}`);
    toast.info("URL da tarefa copiada!");
  }

  const handleDeleteTask = async (id: string) => {
    const result = await Swal.fire({
      title: "Deletar tarefa?",
      text: "Esta ação removerá a tarefa do banco de dados definitivamente!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea3140",
      cancelButtonColor: "#3183ff",
      confirmButtonText: "Sim, deletar",
      cancelButtonText: "Cancelar",
      background: "#121212",
      color: "#fff",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "tarefas", id));
        toast.success("Tarefa removida com sucesso!");
      } catch (err) {
        toast.error("Erro ao deletar tarefa.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel de Controle - Admin 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.taskContainer}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <h1 style={{ color: isAdmin ? "#3183ff" : "#FFF" }}>
              {isAdmin
                ? `Gestão Global (${tasks.length})`
                : `Minhas Tarefas (${tasks.length})`}
            </h1>

            {isAdmin && (
              <Link
                href="/config"
                style={{
                  backgroundColor: "#3183ff",
                  padding: "8px 15px",
                  borderRadius: "4px",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                <FiSettings size={20} /> Preços
              </Link>
            )}
          </div>

          {tasks.length === 0 ? (
            <p className={styles.emptyText}>
              Nenhuma tarefa encontrada no sistema.
            </p>
          ) : (
            tasks.map((item) => (
              <article
                key={item.id}
                className={styles.task}
                style={{ borderLeft: isAdmin ? "5px solid #3183ff" : "none" }}
              >
                <div className={styles.tagContainer}>
                  {item.public && <label className={styles.tag}>PÚBLICA</label>}

                  {/* Exibe o Email do usuário que cadastrou (Apenas se você for Admin) */}
                  {isAdmin && (
                    <span
                      style={{
                        backgroundColor: "#333",
                        color: "#3183ff",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FiUser size={14} /> {item.user}
                    </span>
                  )}

                  <div className={styles.taskActions}>
                    <button
                      className={styles.shareButton}
                      onClick={() => handleShare(item.id)}
                    >
                      <FiShare2 size={20} color="#3183ff" />
                    </button>
                    <button
                      className={styles.trashButton}
                      onClick={() => handleDeleteTask(item.id)}
                    >
                      <FaTrash size={20} color="#ea3140" />
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
                    Registrada em:{" "}
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
    return { redirect: { destination: "/", permanent: false } };
  }

  return {
    props: {
      user: {
        email: session?.user?.email,
        name: session?.user?.name,
      },
    },
  };
};
