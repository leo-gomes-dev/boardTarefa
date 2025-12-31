import { useState } from "react";
import Head from "next/head";

export default function CapturePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // Aqui você pode adicionar integração com seu CRM, Mailchimp, etc.
    console.log("Email capturado:", email);
    setSubmitted(true);
    setEmail("");
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
      <Head>
        <title>OrganizaTask - Assine e organize suas tarefas</title>
      </Head>

      {/* Cabeçalho */}
      <header
        style={{
          textAlign: "center",
          backgroundColor: "#3183ff",
          color: "#fff",
          padding: "60px 20px",
        }}
      >
        <h1 style={{ fontSize: "36px", margin: 0 }}>OrganizaTask</h1>
        <p style={{ fontSize: "18px", marginTop: "10px" }}>
          Organize suas tarefas e aumente sua produtividade
        </p>
      </header>

      {/* Seção de planos */}
      <section style={{ padding: "50px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "30px" }}>
          Escolha seu plano
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {/* Plano Premium */}
          <div
            style={{
              border: "1px solid #3183ff",
              borderRadius: "10px",
              padding: "30px 20px",
              width: "280px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Premium</h3>
            <p
              style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 0" }}
            >
              R$29,90 / mês
            </p>
            <ul style={{ textAlign: "left", paddingLeft: "20px" }}>
              <li>Criar tarefas ilimitadas</li>
              <li>Prioridades: baixa, média, alta</li>
              <li>Tarefas públicas e compartilháveis</li>
              <li>Comentários e colaboração básica</li>
              <li>Backup automático</li>
              <li>Filtros avançados</li>
              <li>Suporte padrão via chat/e-mail</li>
            </ul>
          </div>

          {/* Plano Enterprise */}
          <div
            style={{
              border: "1px solid #ff9b2d",
              borderRadius: "10px",
              padding: "30px 20px",
              width: "280px",
              backgroundColor: "#fff8f0",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Enterprise</h3>
            <p
              style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 0" }}
            >
              R$199,90 / mês
            </p>
            <ul style={{ textAlign: "left", paddingLeft: "20px" }}>
              <li>Todos os benefícios do Premium</li>
              <li>Gerenciamento de múltiplos usuários</li>
              <li>Permissões de equipe (admin, colaborador)</li>
              <li>Painel de produtividade da equipe</li>
              <li>Exportação de relatórios e estatísticas</li>
              <li>Integração com Google Calendar / Outlook</li>
              <li>Suporte prioritário 24/7</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Formulário de captura */}
      <section
        style={{
          backgroundColor: "#3183ff",
          color: "#fff",
          padding: "50px 20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>
          Fique por dentro!
        </h2>
        <p style={{ marginBottom: "30px" }}>
          Inscreva-se para receber novidades, promoções e liberar seu acesso
          Premium.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px 15px",
                borderRadius: "5px",
                border: "none",
                width: "250px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#ff9b2d",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Quero Assinar
            </button>
          </form>
        ) : (
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Obrigado! Entraremos em contato.
          </p>
        )}
      </section>

      {/* Rodapé */}
      <footer
        style={{ textAlign: "center", padding: "20px", fontSize: "14px" }}
      >
        © 2026 OrganizaTask. By Leo Gomes Developer.
      </footer>
    </div>
  );
}
