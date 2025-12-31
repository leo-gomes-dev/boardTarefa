import { NextApiRequest, NextApiResponse } from "next";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configuração do cliente utilizando a variável de ambiente do servidor
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // Definimos como 'let' para permitir a substituição segura em modo de teste
    let { plano, valor, email } = req.body;
    const emailRealParaFirebase = email; // Backup do e-mail logado para o Webhook/Firebase

    /**
     * LÓGICA DE SEGURANÇA PARA TESTES (2026):
     * O Mercado Pago bloqueia pagamentos onde o e-mail do comprador é o mesmo do vendedor.
     * Se detectarmos uma chave de teste (TEST-), forçamos um e-mail de comprador fictício.
     */
    if (process.env.MP_ACCESS_TOKEN?.startsWith("TEST-")) {
      email = "comprador_teste_2026@testuser.com";
    }

    try {
      const preference = new Preference(client);

      // Tratamento do valor: Converte "118,80" para o número 118.80
      const unitPrice = parseFloat(valor.replace(",", "."));

      const result = await preference.create({
        body: {
          items: [
            {
              id: "plano-2026",
              title: plano,
              description: `Upgrade de conta OrganizaTask - ${plano}`,
              quantity: 1,
              unit_price: unitPrice,
              currency_id: "BRL",
            },
          ],
          payer: {
            email: email, // Envia e-mail de teste (no sandbox) ou real (em produção)
          },
          /**
           * IMPORTANTE: O campo 'metadata' é o que seu Webhook deve ler.
           * Aqui enviamos o e-mail real do usuário para garantir a atualização no Firebase.
           */
          metadata: {
            plano: plano,
            email: emailRealParaFirebase,
          },
          back_urls: {
            success: `${req.headers.origin}/dashboard`,
            failure: `${req.headers.origin}/premium`,
            pending: `${req.headers.origin}/dashboard`,
          },
          auto_return: "approved", // Redireciona o usuário sozinho após o pagamento
          payment_methods: {
            excluded_payment_types: [], // Mantém todos os métodos (Pix, Cartão, Boleto)
            installments: 12, // Permite parcelamento
          },
        },
      });

      // Retorna a URL do Checkout Pro (init_point)
      res.status(200).json({
        id: result.id,
        url: result.init_point,
      });
    } catch (err: any) {
      console.error("Erro na API Mercado Pago:", err.message);
      res.status(500).json({ error: "Erro interno ao processar o checkout." });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Método não permitido");
  }
}
