import styles from "./styles.module.css";

interface TaskCounterProps {
  currentTasks: number;
  limit?: number;
}

export function TaskCounter({ currentTasks, limit = 30 }: TaskCounterProps) {
  const isOverLimit = currentTasks >= limit;

  return (
    <p
      style={{
        color: isOverLimit ? "#ea3140" : "#ccc",
        fontSize: "14px",
        marginTop: "15px",
        textAlign: "center",
        fontWeight: isOverLimit ? "bold" : "normal",
        display: "block",
      }}
    >
      {currentTasks} / {limit} tarefas utilizadas
    </p>
  );
}
