import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Username (Publicly Visible)</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        className="form-input"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        required
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-input"
                        value={data.email}
                        autoComplete="username"
                        required
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
                        autoComplete="new-password"
                        required
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password_confirmation">Confirm Password</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        className="form-input"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        required
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    {errors.password_confirmation && <p className="form-error">{errors.password_confirmation}</p>}
                </div>

                <div className="form-actions">
                    <Link href={route('login')} className="auth-link">
                        Already registered?
                    </Link>
                    <button className="btn-primary" disabled={processing}>
                        Register
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
