import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-card">
                <div className="auth-logo">
                    <Link href="/">
                        Hit the Marquee
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}
