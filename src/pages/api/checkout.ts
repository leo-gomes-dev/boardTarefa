import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configuração do cliente com o Access Token de 2026
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { plano, valor, email } = req.body;

    console.log("DEBUG CHECKOUT:", { plano, valor, email });

    try {
      const preference = new Preference(client);

      // Conversão do valor (Stripe usa centavos, MP usa valor real)
      const unitPrice = parseFloat(valor.replace(",", "."));

      const result = await preference.create({
        body: {
          items: [
            {
              id: "plano-2026",
              title: plano,
              description: `Acesso ao OrganizaTask 2026`,
              quantity: 1,
              unit_price: unitPrice,
              currency_id: "BRL",
            },
          ],
          payer: {
            email: email,
          },
          // Equivalente ao Metadata do Stripe
          metadata: {
            plano: plano,
            email: email,
          },
          back_urls: {
            success: `${req.headers.origin}/dashboard`,
            failure: `${req.headers.origin}/premium`,
            pending: `${req.headers.origin}/dashboard`,
          },
          auto_return: "approved",
          // Habilita diversos métodos (Pix, Cartão, Boleto)
          payment_methods: {
            excluded_payment_types: [],
            installments: 12, // Permite parcelamento
          },
        },
      });

      // O Mercado Pago retorna 'id' para o SDK de Frontend
      // ou 'init_point' para redirecionamento direto
      res.status(200).json({
        id: result.id,
        url: result.init_point,
      });
    } catch (err: any) {
      console.error("Erro Mercado Pago:", err.message);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
