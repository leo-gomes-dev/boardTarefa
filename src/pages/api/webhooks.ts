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
import { Resend } from "resend";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Garante que o Mercado Pago sempre receba 200 OK para evitar bloqueios de Proxy
  if (req.method !== "POST") {
    return res.status(200).send("Apenas POST aceito");
  }

  const { data } = req.body;
  const paymentId = data?.id || req.body?.id;

  if (!paymentId) return res.status(200).send("ID ausente");

  try {
    const payment = await new Payment(client).get({ id: String(paymentId) });

    if (payment.status === "approved") {
      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail) return res.status(200).send("Email ausente");

      const userRef = doc(db, "users", userEmail);
      const dataExpiracaoJS = new Date();
      planoNome === "Enterprise 36 Meses"
        ? dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3)
        : dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);

      // Atualiza o Firestore
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

      // Envia o E-mail (Seu HTML)
      try {
        await resend.emails.send({
          from: "OrganizaTask <suporte@leogomesdev.com>",
          to: [userEmail],
          subject: `🚀 Seu plano ${planoNome} está ativo!`,
          html: `<p>Seu pagamento foi confirmado! Plano <strong>${planoNome}</strong> ativo.</p>`,
        });
      } catch (e) {
        console.error("Erro email:", e);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).send("Erro processado");
  }
}
