import '../css/app.scss';
import './bootstrap';

import RootLayout from '@/Layouts/RootLayout';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const persistentLayout = (page) => <RootLayout>{page}</RootLayout>;

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        );
        page.default.layout ??= persistentLayout;
        return page;
    },
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
