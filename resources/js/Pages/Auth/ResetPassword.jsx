import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

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
                        autoFocus
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
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    {errors.password_confirmation && <p className="form-error">{errors.password_confirmation}</p>}
                </div>

                <div className="form-actions">
                    <button className="btn-primary" disabled={processing}>Reset Password</button>
                </div>
            </form>
        </GuestLayout>
    );
}
