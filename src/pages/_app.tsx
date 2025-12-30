import "../../styles/globals.css";
import type { AppProps } from "next/app";
import { Header } from "../components/header";
import { SessionProvider } from "next-auth/react";

// Adicione estas duas linhas
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Header />
      <Component {...pageProps} />

      {/* Adicione o ToastContainer aqui para que funcione em todo o app */}
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
  );
}
