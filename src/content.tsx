import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Toolbar from './features/toolbar/Toolbar'
import css from '@/index.css?inline'
import { useScraper } from '@/hooks/useScraper';

const ROOT_ID = 'coretax-extension-root';

const ContentApp = () => {
    useScraper();
    return <Toolbar />;
}
export default ContentApp;

const injectApp = () => {
    // Prevent double injection
    if (document.getElementById(ROOT_ID)) return;

    const host = document.createElement('div');
    host.id = ROOT_ID;

    // Set styles to ensure the host element doesn't interfere with the page layout
    Object.assign(host.style, {
        position: 'fixed',
        zIndex: '2147483647',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        display: 'block',
    });

    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

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

injectApp();
