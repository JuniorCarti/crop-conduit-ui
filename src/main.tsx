import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

const ashaBaseUrl = import.meta.env.VITE_ASHA_API_BASE_URL;
console.info("[Asha] API base URL:", ashaBaseUrl || "<missing>");

createRoot(document.getElementById("root")!).render(<App />);
