import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "../../services/firebaseConnection";
import { doc, getDoc, setDoc } from "firebase/firestore";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { action, type, data } = req.body;

  console.log(`[WEBHOOK] action=${action} type=${type} paymentId=${data?.id}`);

  // Aceita ambos os formatos do Mercado Pago
  if (
    action === "payment.created" ||
    action === "payment.updated" ||
    type === "payment"
  ) {
    const paymentId = data?.id;

    try {
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment.status !== "approved") {
        return res.status(200).json({ status: "ignored" });
      }

      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail) {
        return res.status(200).json({ error: "Email não encontrado" });
      }

      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      // Evita processar o mesmo pagamento mais de uma vez
      if (userSnap.exists() && userSnap.data()?.paymentId === paymentId) {
        console.log("[WEBHOOK] Pagamento já processado");
        return res.status(200).json({ status: "already_processed" });
      }

      const dataExpiracao = new Date();
      dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

      await setDoc(
        userRef,
        {
          plano: planoNome,
          status: "premium",
          dataAssinatura: new Date(),
          dataExpiracao,
          updatedAt: new Date(),
          paymentId,
        },
        { merge: true }
      );

      console.log(`[SUCESSO] Premium ativado para ${userEmail}`);
    } catch (error: any) {
      console.error("[ERRO WEBHOOK]:", error.message);
      // SEMPRE responder 200 para o MP
      return res.status(200).json({ error: "Erro interno, mas recebido" });
    }
  }

  return res.status(200).json({ received: true });
}
