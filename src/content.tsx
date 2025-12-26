import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Toolbar from './features/toolbar/Toolbar'
import css from '@/index.css?inline'
import { useScraper } from '@/hooks/useScraper';

const ROOT_ID = 'coretax-extension-root';

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
    host.style.display = "block";

    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Inject styles explicitly
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);

    const root = createRoot(shadow);
    root.render(
        <StrictMode>
            <ContentApp />
        </StrictMode>
    );
}

init();
