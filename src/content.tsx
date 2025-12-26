import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Toolbar from './features/toolbar/Toolbar'
import '@/index.css'
import { useScraper } from '@/hooks/useScraper';

const ROOT_ID = 'coretax-extension-root';

// Function to inject styles into Shadow DOM
const injectStyles = (shadowRoot: ShadowRoot) => {
    // We need to inject the Tailwind CSS. 
    // In a CRXJS setup, importing the CSS file in the JS (top of file) usually injects it into document.head.
    // For Shadow DOM, we need to copy those styles or link them.

    // Strategy: We will manually fetch the styling from the document head that Vite injects
    // and clone it into our shadow root. 
    // better strategy for prod: Access the CSS content via import? 
    // For now, let's try to simply adopt the styles or create a link if possible.

    // Simplest working approach for CRXJS + Shadow DOM:
    // Create a style element and copy content if we can, or rely on a wrapper.
    // Actually, CRXJS automatically handles CSS imports by injecting a <style> tag in head.
    // We need that <style> tag inside our Shadow Root.

    // Let's use a standard trick: observe head for new styles (HMR) and copy them.
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'STYLE') {
                    shadowRoot.appendChild(node.cloneNode(true));
                }
            });
        });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    // Copy existing styles
    Array.from(document.querySelectorAll('style')).forEach((style) => {
        shadowRoot.appendChild(style.cloneNode(true));
    });

    // Also copy link rel=stylesheet if needed (production build often uses links)
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach((link) => {
        shadowRoot.appendChild(link.cloneNode(true));
    });
}


// Main Content App Component to allow Hook usage
const ContentApp = () => {
    // Enable the scraper
    useScraper();

    return <Toolbar />;
}

const init = () => {
    // Prevent double injection
    if (document.getElementById(ROOT_ID)) return;

    const host = document.createElement('div');
    host.id = ROOT_ID;
    host.style.position = "fixed";
    host.style.zIndex = "2147483647"; // Max z-index
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.display = "block"; // Ensure it's not hidden

    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    injectStyles(shadow);

    const root = createRoot(shadow);
    root.render(
        <StrictMode>
            <ContentApp />
        </StrictMode>
    );
}

// Observe for page changes or just init on load
// For SPA coretax, we might need to verify the URL or wait for a specific element
// For now, let's inject immediately as a test
init();
