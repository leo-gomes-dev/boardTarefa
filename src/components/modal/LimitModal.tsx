import Link from "next/link";
import styles from "./styles.module.css";

// 1. A interface define "as regras" de como o modal recebe dados
interface LimitModalProps {
  closeModal: () => void;
}

// 2. O componente usa o nome 'closeModal' para fechar o modal
export function LimitModal({ closeModal }: LimitModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Limite Atingido! ☕</h2>
        <p>
          Parece que você está trabalhando duro em 2026! Você atingiu o limite
          de 30 tarefas gratuitas.
        </p>
        <p style={{ marginTop: "10px" }}>
          Que tal <strong>me pagar um café</strong> para desbloquear a
          <strong> Versão Premium</strong> e ter escrita ilimitada para seus
          projetos?
        </p>
        <div className={styles.modalActions}>
          {/* Link para a página onde está o botão do Stripe */}
          <Link href="/premium" className={styles.linkBuy}>
            ☕ ME PAGAR UM CAFÉ (ACESSAR PREMIUM)
          </Link>

          {/* O botão usa a função closeModal que vem do Dashboard */}
          <button onClick={closeModal} className={styles.buttonClose}>
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
