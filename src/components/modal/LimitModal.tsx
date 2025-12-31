import Link from "next/link";
import styles from "./styles.module.css";
import { FaCoffee, FaRocket, FaTimes } from "react-icons/fa";

interface LimitModalProps {
  closeModal: () => void;
}

export function LimitModal({ closeModal }: LimitModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Ícone de fechar no canto superior */}
        <button className={styles.closeIcon} onClick={closeModal}>
          <FaTimes />
        </button>

        <div className={styles.iconHeader}>
          <div className={styles.coffeeCircle}>
            <FaCoffee size={40} color="#FFDD00" />
          </div>
        </div>

        <h2>Limite Atingido! ☕</h2>

        <p className={styles.description}>
          Parece que você está trabalhando duro em 2026! Você atingiu o limite
          de <strong>30 tarefas gratuitas</strong>.
        </p>

        <div className={styles.highlightBox}>
          <FaRocket color="#3183ff" />
          <span>
            Que tal <strong>me pagar um café</strong> para ter escrita ilimitada
            em seus projetos?
          </span>
        </div>

        <div className={styles.modalActions}>
          <Link href="/premium?fromModal=true" className={styles.linkBuy}>
            BORA, PAGAR UM CAFÉ! 🚀
          </Link>

          <button onClick={closeModal} className={styles.buttonClose}>
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
