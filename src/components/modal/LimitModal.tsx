import Link from "next/link";
import styles from "./styles.module.css";

interface LimitModalProps {
  onClose: () => void;
}

export function LimitModal({ onClose }: LimitModalProps) {
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
          <Link href="/pagamento" target="_blank" className={styles.linkBuy}>
            ☕ ME PAGAR UM CAFÉ (ACESSAR PREMIUM)
          </Link>
          <button onClick={onClose} className={styles.buttonClose}>
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
