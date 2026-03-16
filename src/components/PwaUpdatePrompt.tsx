import { useRegisterSW } from "virtual:pwa-register/react";

const PwaUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div style={styles.banner} role="status" aria-live="polite">
      <div style={styles.text}>
        <strong style={styles.title}>Update available</strong>
        <span style={styles.subtitle}>A new version of Leadbox is ready.</span>
      </div>
      <div style={styles.actions}>
        <button
          onClick={() => updateServiceWorker(true)}
          style={styles.reloadBtn}
          aria-label="Reload to update"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: "fixed",
    bottom: "1.25rem",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9998,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "0.85rem 1.1rem",
    boxShadow: "0 8px 24px rgba(20, 184, 166, 0.18)",
    border: "1px solid #e0f2f1",
    minWidth: "300px",
    maxWidth: "420px",
    width: "calc(100vw - 2rem)",
    animation: "slideUp 0.3s ease-out",
  },
  text: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  title: {
    fontSize: "0.875rem",
    color: "#1E293B",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
  },
  subtitle: {
    fontSize: "0.75rem",
    color: "#94A3B8",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 400,
  },
  actions: {
    flexShrink: 0,
  },
  reloadBtn: {
    background: "linear-gradient(135deg, #14B8A6, #0d9488)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "0.4rem 1rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    fontFamily: "Poppins, sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default PwaUpdatePrompt;
