import { useState, useEffect } from "react";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBackOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBackOnline(true);
        // Hide the "back online" message after 3 seconds
        setTimeout(() => setShowBackOnline(false), 3000);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      style={{
        ...styles.bar,
        background: isOnline
          ? "linear-gradient(90deg, #10B981, #059669)"
          : "linear-gradient(90deg, #EF4444, #DC2626)",
      }}
      role="status"
      aria-live="polite"
    >
      <span style={styles.dot} />
      <span style={styles.text}>
        {isOnline
          ? "Back online"
          : "You are offline — some features may be unavailable"}
      </span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.4rem 1rem",
    color: "#ffffff",
    fontSize: "0.8125rem",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 500,
    textAlign: "center",
    animation: "slideDown 0.3s ease-out",
  },
  dot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.8)",
    flexShrink: 0,
  },
  text: {
    lineHeight: 1.4,
  },
};

export default OfflineIndicator;
