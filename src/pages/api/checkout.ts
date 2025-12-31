import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Método não permitido");
  }

  try {
    let { plano, valor, email } = req.body;
    const emailRealParaFirebase = email;

    // Proteção para credenciais de teste
    if (process.env.MP_ACCESS_TOKEN?.startsWith("TEST-")) {
      email = "test_user_123@testuser.com";
    }

    // Tratamento do valor decimal
    const unitPrice = Number(String(valor).replace(",", "."));

    if (!unitPrice || isNaN(unitPrice)) {
      throw new Error("Preço unitário inválido");
    }

    const preference = new Preference(client);

    // Configuração da Preference
    const result = await preference.create({
      body: {
        items: [
          {
            id: "plano-2026",
            title: plano,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: "BRL",
          },
        ],
        payer: { email: email },
        metadata: {
          plano: plano,
          email: emailRealParaFirebase,
        },
        // ATENÇÃO: Ajustado para /api/webhooks (com S) conforme seu teste de sucesso
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks`,
        back_urls: {
          success: `${req.headers.origin}/dashboard`,
          failure: `${req.headers.origin}/premium`,
          pending: `${req.headers.origin}/dashboard`,
        },
        auto_return: "approved",
      },
    });

    // Retorna os dados para o frontend
    return res.status(200).json({
      id: result.id,
      url: result.init_point,
    });
  } catch (err: any) {
    console.error("Erro MP Detalhado:", err.message);
    return res.status(500).json({ error: "Falha ao gerar link de pagamento." });
  }
}
