// pages/api/saveTask.ts
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../services/firebaseConnection";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { taskData, userEmail } = req.body;

  // 1. Verificar o status do plano no Firebase (backend)
  const userRef = doc(db, "users", userEmail);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return res.status(403).json({ error: "Usuário não encontrado." });
  }

  const userData = userSnap.data();
  const isPremium =
    userData.status === "premium" &&
    new Date() < userData.dataExpiracao.toDate();

  // 2. Se for gratuito, verificar o limite de tarefas
  if (!isPremium) {
    const tasksCollection = collection(db, "tarefas");
    const userTasksQuery = query(
      tasksCollection,
      where("user", "==", userEmail)
    );
    const userTasksSnap = await getDocs(userTasksQuery);

    // Se o usuário gratuito já tem 30 ou mais tarefas, bloqueia
    if (userTasksSnap.size >= 30) {
      return res
        .status(402)
        .json({
          error: "Limite de tarefas atingido. Faça upgrade para Premium!",
        });
    }
  }

  // 3. Se passou pelas regras (ou é Premium), salva a tarefa
  try {
    await addDoc(collection(db, "tarefas"), taskData);
    res
      .status(200)
      .json({ success: true, message: "Tarefa salva com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar tarefa no Firebase." });
  }
}
