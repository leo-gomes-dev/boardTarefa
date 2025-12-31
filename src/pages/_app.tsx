import "../../styles/globals.css";
import type { AppProps } from "next/app";
import { Header } from "../components/header";
import { SessionProvider } from "next-auth/react";

// Importações do Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Adicione o Provider do Helmet para compatibilidade com React 19 em 2026
import { HelmetProvider } from "react-helmet-async";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HelmetProvider>
      <SessionProvider session={pageProps.session}>
        <Header />
        <Component {...pageProps} />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </SessionProvider>
    </HelmetProvider>
  );
}
