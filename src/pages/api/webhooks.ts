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

  // O ID pode vir em lugares diferentes dependendo da versão da API do MP
  const { action, type, data } = req.body;
  const paymentId = data?.id || req.body.id;

  if (type === "payment" || action?.includes("payment")) {
    if (!paymentId) return res.status(200).send("ID ausente");

    try {
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment.status !== "approved") {
        return res.status(200).send("Pagamento não aprovado");
      }

      // Extrai os dados do metadata que enviamos na criação da preferência
      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano; // "Premium Anual" ou "Enterprise 36 Meses"

      if (!userEmail) {
        console.error("E-mail não encontrado no metadata do pagamento.");
        return res.status(200).send("Metadata ausente");
      }

      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      // Evita processar o mesmo pagamento duas vezes
      if (
        userSnap.exists() &&
        userSnap.data()?.paymentId === String(paymentId)
      ) {
        return res.status(200).send("Já processado");
      }

      // LÓGICA DE EXPIRAÇÃO 2026
      const dataExpiracaoJS = new Date();
      if (planoNome === "Enterprise 36 Meses") {
        // Soma 3 anos
        dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3);
      } else {
        // Soma 1 ano para "Premium Anual" ou qualquer outro
        dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);
      }

      // SALVANDO NO BANCO COM OS NOMES CORRETOS
      await setDoc(
        userRef,
        {
          plano: planoNome,
          status: "premium",
          paymentId: String(paymentId),
          dataAssinatura: serverTimestamp(),
          dataExpiracao: Timestamp.fromDate(dataExpiracaoJS),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `Plano ${planoNome} ativado para ${userEmail} até ${dataExpiracaoJS.toLocaleDateString()}`
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro no Webhook:", error);
      return res.status(200).send("Erro interno");
    }
  }

  return res.status(200).send("OK");
}
