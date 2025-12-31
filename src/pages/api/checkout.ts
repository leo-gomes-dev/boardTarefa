import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: "2025-12-15.clover",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { plano, valor, email } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: plano,
                description: `Acesso ao OrganizaTask 2026`,
              },
              unit_amount: Math.round(
                parseFloat(valor.replace(",", ".")) * 100
              ),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        // --- INICIO METADATA ---
        metadata: {
          plano: plano, // Nome do plano (Ex: Premium Plus ou Enterprise)
          email: email, // Backup do email por segurança
        },
        // --- FIM DO METADATA ---
        success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/premium`,
      });

      res.status(200).json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error("Erro Stripe:", err.message);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
