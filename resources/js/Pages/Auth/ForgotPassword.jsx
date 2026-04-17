import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <p className="form-hint">
                Forgot your password? Enter your email and we'll send you a reset link.
            </p>

            {status && <p className="form-status">{status}</p>}

            <form onSubmit={submit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-input"
                        value={data.email}
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div className="form-actions">
                    <button className="btn-primary" disabled={processing}>
                        Email Password Reset Link
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
