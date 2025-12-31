import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
        payment_method_types: ["card", "pix"], // Habilita Cartão e Pix no Stripe
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
              ), // Converte R$ para centavos
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/premium`,
      });

      res.status(200).json({ id: session.id, url: session.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
