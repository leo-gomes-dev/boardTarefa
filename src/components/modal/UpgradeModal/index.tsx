import Link from "next/link";
import styles from "./styles.module.css";
import { FaCoffee, FaRocket } from "react-icons/fa";

interface UpgradeModalProps {
  closeModal: () => void;
  featureName: string;
}

export function UpgradeModal({ closeModal, featureName }: UpgradeModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconHeader}>
          <FaCoffee size={50} color="#FFDD00" />
        </div>

        <h2>Me paga um café? ☕</h2>

        <p>
          A função de <strong>{featureName}</strong> é exclusiva para apoiadores
          do projeto em 2026.
        </p>

        <div className={styles.modalActions}>
          <Link href="/premium?fromModal=true" className={styles.linkBuy}>
            BORA, VOU APOIAR! 🚀
          </Link>

          <button onClick={closeModal} className={styles.buttonClose}>
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
