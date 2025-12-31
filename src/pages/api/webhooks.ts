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
  // Em produção na Coolify, o MP pode as vezes testar a rota via GET/PUT. Retornamos 200 sempre para não dar erro de Proxy.
  if (req.method !== "POST") {
    return res.status(200).send("Method Not Allowed mas OK para Proxy");
  }

  // Captura robusta do ID para garantir que o PIX (que as vezes envia o ID via data.id ou query) seja lido
  const { action, type, data } = req.body;
  const paymentId =
    data?.id || req.body?.id || req.body?.data?.id || req.query?.id;

  if (paymentId && (type === "payment" || action?.includes("payment"))) {
    try {
      const payment = await new Payment(client).get({ id: String(paymentId) });

      if (payment.status !== "approved") {
        return res.status(200).send("Aguardando aprovação");
      }

      const userEmail = payment.metadata?.email;
      const planoNome = payment.metadata?.plano;

      if (!userEmail || !planoNome) {
        console.log("LOG: Notificação sem metadados.");
        return res.status(200).send("OK (Sem metadados)");
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
      planoNome === "Enterprise 36 Meses"
        ? dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3)
        : dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);

      // --- 1. ATUALIZA O BANCO (PRIORIDADE) ---
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
        console.error("LOG: Falha no e-mail, mas banco atualizado.");
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("LOG: Erro Webhook:", error);
      return res.status(200).send("Erro tratado para evitar loop do MP");
    }
  }

  return res.status(200).send("OK");
}
