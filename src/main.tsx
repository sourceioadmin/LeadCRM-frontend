import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import theme files
import "./styles/theme.css";
import "./styles/bootstrap-override.scss";
import "./styles/components.css";

// // Import Google Fonts
// import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Nunito:wght@300;400;600;700&display=swap";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


