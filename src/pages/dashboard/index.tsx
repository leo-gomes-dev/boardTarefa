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
  const [totalCount, setTotalCount] = useState(0);

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ NOVO – estado do modal de explicação
  const [showPublicInfo, setShowPublicInfo] = useState(false);

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

    const qCount = query(
      collection(db, "tarefas"),
      where("user", "==", user.email)
    );
    const unsubCount = onSnapshot(qCount, (snapshot) => {
      setTotalCount(snapshot.size);
    });

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
      setTasks((prev) => [...prev, ...lista]);
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
          priority,
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
          priority,
        });
        toast.success("Tarefa registrada!");
      }

      setInput("");
      setPublicTask(false);
      setPriority("baixa");
    } catch {
      toast.error("Erro ao salvar no banco.");
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - OrganizaTask 2026</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
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
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "15px",
                }}
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
                  style={{ color: "#FFF", cursor: "pointer", fontSize: "15px" }}
                >
                  Deixar Pública
                </label>

                {/* ✅ NOVO – abrir modal */}
                <span
                  onClick={() => setShowPublicInfo(true)}
                  style={{
                    color: "#4da6ff",
                    cursor: "pointer",
                    fontSize: "13px",
                    textDecoration: "underline",
                  }}
                >
                  O que é isso?
                </span>
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
      </main>

      {/* ✅ NOVO – Modal explicativo */}
      {showPublicInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              color: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "320px",
            }}
          >
            <h3>Tarefa Pública</h3>
            <p>
              Ao deixar a tarefa <strong>pública</strong>, ela poderá ser
              compartilhada com outras pessoas.
            </p>
            <p>
              Quem receber o link poderá visualizar a tarefa e adicionar
              comentários.
            </p>
            <button
              onClick={() => setShowPublicInfo(false)}
              style={{
                marginTop: "15px",
                background: "#3183ff",
                border: "none",
                padding: "8px 12px",
                color: "#fff",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

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
