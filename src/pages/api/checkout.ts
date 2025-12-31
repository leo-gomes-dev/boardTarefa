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
    // Usamos 'let' para permitir a reatribuição do e-mail
    let { plano, valor, email } = req.body;
    const emailRealParaFirebase = email; // Guardamos o e-mail original para o Firebase

    // Se estivermos em ambiente de teste (verificado pela chave de acesso)
    // Trocamos o e-mail que o Mercado Pago vai enxergar
    if (process.env.MP_ACCESS_TOKEN?.startsWith("TEST-")) {
      email = "comprador_teste_2026@testuser.com";
    }

    try {
      const preference = new Preference(client);

      // Conversão do valor (Mercado Pago usa valor real, não centavos)
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
            email: email, // MP verá o e-mail de teste/real aqui
          },
          metadata: {
            plano: plano,
            // O Firebase lerá este e-mail para identificar o usuário real
            email: emailRealParaFirebase,
          },
          back_urls: {
            success: `${req.headers.origin}/dashboard`,
            failure: `${req.headers.origin}/premium`,
            pending: `${req.headers.origin}/dashboard`,
          },
          auto_return: "approved", // Redireciona automaticamente após pagamento
          payment_methods: {
            excluded_payment_types: [], // Garante que Pix/Boleto não sejam excluídos
            installments: 12, // Permite parcelamento no cartão em até 12x
          },
        },
      });

      // Retorna o link (init_point) para o frontend redirecionar o usuário
      res.status(200).json({
        id: result.id,
        url: result.init_point,
      });
    } catch (err: any) {
      // Em produção, use um serviço de log como Sentry, não apenas console.error
      console.error("Erro Mercado Pago:", err.message);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
