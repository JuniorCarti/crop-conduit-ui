import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import { validateEnvironment } from "./lib/envValidation";

// Validate environment at startup
const envResult = validateEnvironment();
if (!envResult.valid && import.meta.env.DEV) {
  console.warn(
    '%c⚠️ AgriSmart: Missing required environment variables',
    'color: orange; font-weight: bold',
    envResult.missing
  );
}

createRoot(document.getElementById("root")!).render(<App />);
