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
import { Resend } from "resend"; // Importação do serviço de e-mail

// Configuração do cliente Mercado Pago e Resend
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { action, type, data } = req.body;
  const paymentId = data?.id || req.body.id;

  if (type === "payment" || action?.includes("payment")) {
    if (!paymentId) return res.status(200).send("ID ausente");

    try {
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment.status !== "approved") {
        return res.status(200).send("Pagamento não aprovado");
      }

      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail) {
        console.error("E-mail não encontrado no metadata do pagamento.");
        return res.status(200).send("Metadata ausente");
      }

      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      if (
        userSnap.exists() &&
        userSnap.data()?.paymentId === String(paymentId)
      ) {
        return res.status(200).send("Já processado");
      }

      const dataExpiracaoJS = new Date();
      if (planoNome === "Enterprise 36 Meses") {
        dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3);
      } else {
        dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);
      }

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

      // --- TRECHO DE ENVIO DE E-MAIL (NOVO) ---
      try {
        await resend.emails.send({
          from: "OrganizaTask <onboarding@resend.dev>",
          to: [userEmail],
          subject: `🚀 Seu plano ${planoNome} está ativo!`,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h1 style="color: #3183ff;">Olá!</h1>
              <p>Boas notícias: seu pagamento foi confirmado e o <strong>OrganizaTask 2026</strong> já liberou seu acesso!</p>
              <p><strong>Plano Ativado:</strong> ${planoNome}</p>
              <p><strong>Validade até:</strong> ${dataExpiracaoJS.toLocaleDateString()}</p>
              <p>Aproveite todas as novas ferramentas de produtividade agora mesmo.</p>
              <br />
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="display: inline-block; background: #3183ff; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                 Acessar meu Painel
              </a>
              <br /><br />
              <p style="font-size: 12px; color: #888;">Obrigado por apoiar nosso projeto e nos pagar esse café! ☕</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Erro ao enviar e-mail de boas-vindas:", emailErr);
      }
      // --- FIM DO TRECHO DE E-MAIL ---

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
