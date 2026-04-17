import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Navbar() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar-container">
            <button
                className={`corner-button navbar-toggle ${menuOpen ? '' : 'closed'}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle navigation"
            >
                { menuOpen ? "X" : "☰" }
            </button>
            <div className={`navbar ${menuOpen ? '' : 'closed'}`}>
                <div className="navbar-game">
                    <Link href="/" onClick={() => setMenuOpen(false)}>Play</Link>
                    <Link href={route('leaderboard')} onClick={() => setMenuOpen(false)}>Leaderboard</Link>
                </div>

                {user ? (
                    <div className="navbar-user">
                        <Link href={route('profile.edit')} onClick={() => setMenuOpen(false)}>Profile</Link>
                        <Link className="logout" href={route('logout')} method="post" onClick={() => setMenuOpen(false)}>
                            Log Out
                        </Link>
                    </div>
                ) : (
                    <div className="navbar-user">
                        <Link href={route('login')} onClick={() => setMenuOpen(false)}>Log In</Link>
                        <Link href={route('register')} onClick={() => setMenuOpen(false)}>Register</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
