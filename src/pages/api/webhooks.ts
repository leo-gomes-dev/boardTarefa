// pages/api/webhooks.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { db } from "../../services/firebaseConnection";
import { doc, updateDoc, setDoc } from "firebase/firestore";

// Método nativo para converter a requisição em buffer sem a lib 'micro'
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: "2025-12-15.clover",
});

export const config = {
  api: {
    bodyParser: false, // Necessário para validação da assinatura do Stripe
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Evento disparado quando o pagamento é concluído com sucesso
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userEmail = session.customer_email || session.metadata?.email;
      const planoNome = session.metadata?.plano;

      if (userEmail) {
        try {
          const dataExpiracao = new Date();
          dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

          const userRef = doc(db, "users", userEmail);

          // Usamos setDoc com { merge: true } para criar o documento caso não exista
          await setDoc(
            userRef,
            {
              plano: planoNome,
              status: "premium",
              dataAssinatura: new Date(),
              dataExpiracao: dataExpiracao,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          console.log(`Usuário ${userEmail} atualizado para Premium.`);
        } catch (error) {
          console.error("Erro ao atualizar Firebase via Webhook:", error);
        }
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
