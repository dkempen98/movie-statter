import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const [saved, setSaved] = useState(false);

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            },
        });
    };

    return (
        <section className="profile-section">
            <h2>Profile Information</h2>

            <form onSubmit={submit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Username</label>
                    <input
                        id="name"
                        type="text"
                        className="form-input"
                        value={data.name}
                        autoComplete="name"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="form-group">
                        <p>Your email address is unverified.{' '}
                            <Link href={route('verification.send')} method="post" as="button" className="auth-link">
                                Resend verification email.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="form-status">A new verification link has been sent.</p>
                        )}
                    </div>
                )}

                <div className="form-actions">
                    {saved && <span className="form-status">Saved.</span>}
                    <button className="btn-primary" disabled={processing}>Save</button>
                </div>
            </form>
        </section>
    );
}
