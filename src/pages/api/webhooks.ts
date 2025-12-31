import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "../../services/firebaseConnection";
import { doc, setDoc } from "firebase/firestore";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // O Mercado Pago sempre envia via POST
  if (req.method === "POST") {
    const { action, data } = req.body;

    console.log(`[WEBHOOK RECEBIDO]: Ação: ${action} | ID: ${data?.id}`);

    // Verificamos se é uma notificação de pagamento
    if (action === "payment.created" || action === "payment.updated") {
      const paymentId = data.id;

      try {
        // Consultar os detalhes do pagamento no Mercado Pago
        const payment = await new Payment(client).get({ id: paymentId });

        console.log(
          `[STATUS PAGAMENTO]: ${payment.status} para o ID: ${paymentId}`
        );

        // Verificamos se o status é 'approved' (aprovado)
        if (payment.status === "approved") {
          const userEmail = payment.metadata?.email;
          const planoNome = payment.metadata?.plano;

          if (userEmail) {
            const dataExpiracao = new Date();
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

            const userRef = doc(db, "users", userEmail);

            await setDoc(
              userRef,
              {
                plano: planoNome,
                status: "premium",
                dataAssinatura: new Date(),
                dataExpiracao: dataExpiracao,
                updatedAt: new Date(),
                paymentId: paymentId,
              },
              { merge: true }
            );

            console.log(
              `[SUCESSO]: Usuário ${userEmail} atualizado para Premium.`
            );
          }
        }
      } catch (error: any) {
        console.error("[ERRO WEBHOOK]:", error.message);
        // Respondemos 200 mesmo em erro de lógica para o MP não ficar tentando reenviar
        return res.status(200).json({ error: "Erro interno mas recebido" });
      }
    }

    // Resposta obrigatória 200 ou 201 para o Mercado Pago
    return res.status(200).json({ received: true });
  } else {
    // Caso alguém tente acessar via GET, retorna 405
    res.setHeader("Allow", "POST");
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
