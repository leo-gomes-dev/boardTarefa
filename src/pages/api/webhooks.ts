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
  if (req.method === "POST") {
    // O Mercado Pago envia o tipo de ação e o ID no query ou no body
    const { action, data } = req.body;

    // Verificamos se é uma notificação de pagamento criado/atualizado
    if (action === "payment.created" || action === "payment.updated") {
      const paymentId = data.id;

      try {
        // Consultar os detalhes do pagamento no Mercado Pago
        const payment = await new Payment(client).get({ id: paymentId });

        // Verificamos se o status é 'approved' (aprovado)
        if (payment.status === "approved") {
          // No Mercado Pago, os metadados ficam em payment.metadata
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
                paymentId: paymentId, // Referência do MP
              },
              { merge: true }
            );

            console.log(
              `Usuário ${userEmail} atualizado para Premium via Mercado Pago.`
            );
          }
        }
      } catch (error: any) {
        console.error(
          "Erro ao processar Webhook do Mercado Pago:",
          error.message
        );
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }

    // O Mercado Pago exige resposta 200 ou 201 para confirmar o recebimento
    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
