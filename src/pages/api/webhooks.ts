import type { NextApiRequest, NextApiResponse } from "next";
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

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sempre 200 para evitar bloqueios / retries do Mercado Pago
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    // Garante body válido (Coolify / proxies às vezes enviam string)
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    // Mercado Pago envia o ID de formas diferentes
    const paymentId = body?.data?.id || body?.id || req.query?.id;

    if (!paymentId) {
      return res.status(200).send("Sem paymentId");
    }

    const payment = await new Payment(client).get({
      id: String(paymentId),
    });

    // Processa apenas pagamentos aprovados
    if (payment.status !== "approved") {
      return res.status(200).send("Pagamento não aprovado");
    }

    const userEmail = payment.metadata?.email;
    const planoNome = payment.metadata?.plano;

    if (!userEmail || !planoNome) {
      return res.status(200).send("Metadata ausente");
    }

    const userRef = doc(db, "users", userEmail);
    const userSnap = await getDoc(userRef);

    // Idempotência — evita processar duas vezes
    if (userSnap.exists() && userSnap.data()?.paymentId === String(paymentId)) {
      return res.status(200).send("Pagamento já processado");
    }

    // Define validade do plano
    const dataExpiracaoJS = new Date();
    if (planoNome === "Enterprise 36 Meses") {
      dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 3);
    } else {
      dataExpiracaoJS.setFullYear(dataExpiracaoJS.getFullYear() + 1);
    }

    // Atualiza Firestore
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

    // Envio de e-mail (não bloqueia o webhook)
    try {
      const baseUrl =
        process.env.NEXTAUTH_URL || "https://tarefas.leogomesdev.com";

      await resend.emails.send({
        from: "OrganizaTask <suporte@leogomesdev.com>",
        to: [userEmail],
        subject: `🚀 Seu plano ${planoNome} está ativo!`,
        html: `
          <div style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:10px;">
            <h1 style="color:#3183ff;">Olá!</h1>
            <p>Seu pagamento foi confirmado e seu acesso ao <strong>OrganizaTask 2026</strong> já está liberado.</p>
            <p><strong>Plano:</strong> ${planoNome}</p>
            <p><strong>Válido até:</strong> ${dataExpiracaoJS.toLocaleDateString()}</p>
            <br/>
            <div style="text-align:center;">
              <a href="${baseUrl}/dashboard"
                 style="display:inline-block;background:#3183ff;color:#fff;padding:12px 25px;border-radius:5px;text-decoration:none;font-weight:bold;">
                Acessar meu Painel
              </a>
            </div>
            <br/>
            <p style="font-size:12px;color:#888;text-align:center;">
              Obrigado por apoiar o OrganizaTask ☕
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro Webhook Mercado Pago:", error);
    return res.status(200).send("Erro tratado");
  }
}
