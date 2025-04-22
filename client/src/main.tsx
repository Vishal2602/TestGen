import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add RemixIcon CDN
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
document.head.appendChild(linkElement);

// Add font links
const fontLinkElement = document.createElement('link');
fontLinkElement.rel = 'stylesheet';
fontLinkElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap';
document.head.appendChild(fontLinkElement);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'TestGen - LLM-Powered JavaScript Testing Tool';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
