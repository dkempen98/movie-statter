import { Link, usePage } from '@inertiajs/react';
import {useEffect, useRef, useState} from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
    const { auth } = usePage().props;
    const refOne = useRef(null)
    const user = auth?.user;
    const [menuOpen, setMenuOpen] = useState(false);

    function handleClickOutside(e) {
        if(e.target && refOne.current) {
            if(!refOne.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
    }

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true)
        return () => document.removeEventListener("click", handleClickOutside, true)
    }, [])

    return (
        <div className={`${menuOpen ? 'overlay' : ''}`}>
            <nav className="navbar-container" ref={refOne}>
                <button
                    className={`corner-button navbar-toggle ${menuOpen ? '' : 'closed'}`}
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Toggle navigation"
                >
                    { menuOpen ? <FaTimes /> : <FaBars /> }
                </button>
                <div className={`navbar ${menuOpen ? '' : 'closed'} ${user?.is_admin ? 'admin' : ''}`}>
                    <div className="navbar-game">
                        <Link href="/" onClick={() => setMenuOpen(false)}>Play</Link>
                        <Link href={route('leaderboard')} onClick={() => setMenuOpen(false)}>Leaderboard</Link>
                    </div>

                    {user ? (
                        <div className="navbar-user">
                            { user.is_admin === 1 && (
                                <Link href={route('game.create')} onClick={() => setMenuOpen(false)}>Create</Link>
                            )}
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
        </div>
    );
}
