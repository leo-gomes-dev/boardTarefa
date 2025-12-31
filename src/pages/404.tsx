import Head from "next/head";
import Link from "next/link";
import { Header } from "../components/header";
import { Footer } from "../components/footer";

export default function Custom404() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        color: "#fff",
      }}
    >
      <Head>
        <title>Página não encontrada | OrganizaTask 2026</title>
      </Head>

      <Header />

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "600px",
            padding: "40px 20px",
            backgroundColor: "#1a1a2e",
            borderRadius: "12px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#ea3140",
            }}
          >
            404
          </h1>
          <p style={{ fontSize: "18px", marginBottom: "30px", opacity: 0.8 }}>
            Oops! A página que você procura não existe.
          </p>
          <Link href="/">
            <button
              style={{
                backgroundColor: "#3183ff",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#2564d1")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#3183ff")
              }
            >
              Voltar para Home
            </button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
