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
  if (req.method !== "POST") return res.status(405).end();

  // Captura o ID de todas as formas possíveis que o MP envia
  const { action, type, data } = req.body;
  const paymentId = data?.id || req.body?.id || req.body?.data?.id;

  if (paymentId && (type === "payment" || action?.includes("payment"))) {
    try {
      const payment = await new Payment(client).get({ id: paymentId });

      // Só prossegue se o pagamento estiver aprovado
      if (payment.status !== "approved") {
        return res.status(200).send("Aguardando aprovação");
      }

      // IMPORTANTE: Se for teste do MP ou metadata estiver vazio, encerramos aqui com 200
      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail || !planoNome) {
        console.log("Notificação recebida, mas sem metadados (E-mail/Plano).");
        return res.status(200).send("OK (Sem metadados)");
      }

      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      // Evita duplicidade de processamento
      if (
        userSnap.exists() &&
        userSnap.data()?.paymentId === String(paymentId)
      ) {
        return res.status(200).send("Já processado anteriormente");
      }

      // Cálculo de Expiração
      const dataExpiracaoJS = new Date();
      planoNome === "Enterprise 36 Meses"
        ? dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3)
        : dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);

      // --- 1. ATUALIZA O BANCO ---
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

      // --- 2. ENVIA O E-MAIL (MANTIDO SEU HTML ORIGINAL) ---
      try {
        const baseUrl =
          process.env.NEXTAUTH_URL || "https://tarefas.leogomesdev.com";
        await resend.emails.send({
          from: "OrganizaTask <suporte@leogomesdev.com>",
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
              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" 
                   style="display: inline-block; background: #3183ff; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                   Acessar meu Painel
                </a>
              </div>
              <br /><br />
              <p style="font-size: 12px; color: #888; text-align: center;">Obrigado por apoiar nosso projeto e nos pagar esse café! ☕</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Falha no e-mail:", e);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro no processamento do Webhook:", error);
      return res.status(200).send("Erro interno ignorado para o MP");
    }
  }

  return res.status(200).send("OK");
}
