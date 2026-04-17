import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <p className="form-hint">
                Thanks for signing up! Please verify your email address by clicking the link we sent you.
                If you didn't receive it, we can send another.
            </p>

            {status === 'verification-link-sent' && (
                <p className="form-status">A new verification link has been sent to your email address.</p>
            )}

            <form onSubmit={submit}>
                <div className="form-actions">
                    <Link href={route('logout')} method="post" as="button" className="auth-link">
                        Log Out
                    </Link>
                    <button className="btn-primary" disabled={processing}>
                        Resend Verification Email
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
