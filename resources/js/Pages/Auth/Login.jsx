import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && <div className="form-status">{status}</div>}

            <form onSubmit={submit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-input"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="form-input"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <label className="form-check">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                    />
                    Remember me
                </label>

                <div className="form-actions">
                    {canResetPassword && (
                        <Link href={route('password.request')} className="auth-link">
                            Forgot your password?
                        </Link>
                    )}
                    <button className="btn-primary" disabled={processing}>
                        Log in
                    </button>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link href={route('register')} className="auth-link">
                        Don't have an account? Register
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
