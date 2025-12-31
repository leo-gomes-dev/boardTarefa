import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "../../services/firebaseConnection";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas POST é aceito pelo Mercado Pago
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { action, type, data } = req.body;

  // Log para monitoramento no servidor (Vercel/Railway/etc)
  console.log(
    `[WEBHOOK] Evento recebido: action=${action}, type=${type}, id=${data?.id}`
  );

  // O Mercado Pago envia notificações por diferentes tipos. Filtramos apenas pagamentos.
  if (type === "payment" || action?.includes("payment")) {
    const paymentId = data?.id;

    if (!paymentId) {
      return res.status(200).json({ message: "ID de pagamento ausente" });
    }

    try {
      // 1. Busca os detalhes do pagamento no Mercado Pago
      const payment = await new Payment(client).get({ id: paymentId });

      // Só processamos se o status for "approved"
      if (payment.status !== "approved") {
        console.log(
          `[WEBHOOK] Pagamento ${paymentId} ainda está como: ${payment.status}`
        );
        return res.status(200).send("OK"); // Respondemos 200 para o MP parar de tentar
      }

      // 2. Extrai os dados que você enviou no 'metadata' lá no checkout
      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail) {
        console.error("[ERRO] Metadata 'email' não encontrado no pagamento.");
        return res.status(200).send("Metadata ausente");
      }

      // 3. Referência do documento do usuário
      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      // 4. Verificação de Duplicidade (Idempotência)
      // Se o usuário já tiver esse paymentId gravado, ignoramos para não renovar datas por erro
      if (
        userSnap.exists() &&
        userSnap.data()?.paymentId === String(paymentId)
      ) {
        console.log("[WEBHOOK] Pagamento duplicado detectado. Ignorando.");
        return res.status(200).send("Already processed");
      }

      // 5. Cálculo da data de expiração (1 ano a partir de hoje)
      const agora = new Date();
      const dataExpiracaoJS = new Date();
      dataExpiracaoJS.setFullYear(agora.getFullYear() + 1);

      // 6. Atualização ou Criação automática no Firebase
      await setDoc(
        userRef,
        {
          plano: planoNome || "Premium",
          status: "premium",
          paymentId: String(paymentId),
          dataAssinatura: serverTimestamp(), // Data exata do servidor Google
          dataExpiracao: Timestamp.fromDate(dataExpiracaoJS), // Formato Timestamp para o Firestore
          updatedAt: serverTimestamp(),
          // Se quiser guardar o valor pago:
          valorPago: payment.transaction_amount,
        },
        { merge: true } // MANTÉM outros dados do usuário (nome, etc) se ele já existir
      );

      console.log(`[SUCESSO] Plano ${planoNome} ativado para: ${userEmail}`);

      // Resposta de sucesso absoluta para o Mercado Pago
      return res.status(200).json({ status: "success", user: userEmail });
    } catch (error: any) {
      console.error("[ERRO CRÍTICO WEBHOOK]:", error?.message || error);
      // Retornamos 200 mesmo em erro para evitar que o Mercado Pago entre em loop
      // de retentativas infinitas se for um erro de código.
      return res.status(200).json({ error: "Erro interno processado" });
    }
  }

  // Para outros tipos de notificações (planos, assinaturas recorrentes, etc)
  return res.status(200).send("OK");
}
