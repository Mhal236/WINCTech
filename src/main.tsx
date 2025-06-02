import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🔵 Main.tsx: Starting app initialization...');

const rootElement = document.getElementById("root");
console.log('🔵 Main.tsx: Root element found:', !!rootElement);

if (rootElement) {
  console.log('🔵 Main.tsx: Creating React root...');
  const root = createRoot(rootElement);
  console.log('🔵 Main.tsx: Rendering App component...');
  root.render(<App />);
  console.log('🔵 Main.tsx: App rendered successfully');
} else {
  console.error('🔴 Main.tsx: Root element not found!');
}
