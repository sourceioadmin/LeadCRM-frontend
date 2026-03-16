import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show if the user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div style={styles.banner} role="banner" aria-label="Install Leadbox app">
      <div style={styles.iconWrapper}>
        <img src="/pwa-64x64.png" alt="Leadbox" style={styles.icon} />
      </div>
      <div style={styles.text}>
        <strong style={styles.title}>Install Leadbox</strong>
        <span style={styles.subtitle}>
          Add to your home screen for a faster experience
        </span>
      </div>
      <div style={styles.actions}>
        <button
          onClick={handleInstall}
          style={styles.installBtn}
          aria-label="Install app"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={styles.dismissBtn}
          aria-label="Dismiss install prompt"
        >
          ✕
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
    zIndex: 9999,
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
  iconWrapper: {
    flexShrink: 0,
  },
  icon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
  },
  text: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflow: "hidden",
  },
  title: {
    fontSize: "0.875rem",
    color: "#1E293B",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  subtitle: {
    fontSize: "0.75rem",
    color: "#94A3B8",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 400,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexShrink: 0,
  },
  installBtn: {
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
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "0.25rem",
    lineHeight: 1,
    borderRadius: "4px",
  },
};

export default PwaInstallPrompt;
