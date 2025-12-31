import Head from "next/head";

export default function Politica() {
  return (
    <div className="max-w-4xl mx-auto p-8 leading-relaxed text-gray-800">
      <Head>
        <title>Política de Uso e Reembolso | OrganizaTask</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">
        Política de Uso e Termos de Reembolso
      </h1>

      <p className="mb-4">
        Ao contratar os serviços do <strong>OrganizaTask</strong>, o usuário
        concorda com os termos aqui estabelecidos. Esta política visa a
        transparência e a segurança jurídica de ambas as partes.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          1. Direito de Arrependimento (Reembolso)
        </h2>
        <p className="mb-2">
          Em conformidade com o{" "}
          <strong>Artigo 49 do Código de Defesa do Consumidor (CDC)</strong>, o
          cliente possui o prazo de <strong>7 (sete) dias corridos</strong>, a
          contar da data de confirmação do pagamento, para solicitar o
          cancelamento e o reembolso integral do valor pago.
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>
            A solicitação deve ser feita via e-mail ou canais oficiais de
            suporte.
          </li>
          <li>
            Após os 7 dias, não haverá reembolso proporcional ou total das
            parcelas já pagas, dado que o serviço é de entrega digital imediata.
          </li>
          <li>
            Em planos anuais, o cancelamento após o prazo de 7 dias interrompe a
            renovação futura, mas mantém o acesso até o fim do período já pago.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">2. Natureza do Serviço</h2>
        <p>
          O OrganizaTask é um software como serviço (SaaS). O usuário declara
          estar ciente de que:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>
            Interrupções momentâneas para manutenção técnica são previsíveis e
            não geram direito a indenização.
          </li>
          <li>
            A responsabilidade pela guarda da senha e pelo uso da conta é
            exclusiva do usuário.
          </li>
          <li>
            O uso de automações (bots) ou tentativa de engenharia reversa no
            sistema resultará em banimento imediato sem reembolso.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          3. Proteção de Dados (LGPD)
        </h2>
        <p>
          Os dados coletados (e-mail e informações de pagamento via Stripe) são
          utilizados exclusivamente para a prestação do serviço e faturamento,
          conforme a Lei Geral de Proteção de Dados. O OrganizaTask não
          comercializa dados de usuários.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          4. Limitação de Responsabilidade
        </h2>
        <p>
          A empresa não se responsabiliza por prejuízos decorrentes de perda de
          prazos ou má gestão das tarefas pelo usuário. O software é uma
          ferramenta de auxílio, e o resultado final depende da alimentação de
          dados do próprio cliente.
        </p>
      </section>

      <footer className="mt-12 text-sm text-gray-500 border-t pt-4">
        Atualizado em 02 de Janeiro de 2026. Leo Gomes Developer.
      </footer>
    </div>
  );
}
