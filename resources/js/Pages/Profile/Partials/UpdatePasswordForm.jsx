import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const [saved, setSaved] = useState(false);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className="profile-section">
            <h2>Update Password</h2>

            <form onSubmit={updatePassword}>
                <div className="form-group">
                    <label className="form-label" htmlFor="current_password">Current Password</label>
                    <input
                        id="current_password"
                        type="password"
                        className="form-input"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        autoComplete="current-password"
                        onChange={(e) => setData('current_password', e.target.value)}
                    />
                    {errors.current_password && <p className="form-error">{errors.current_password}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">New Password</label>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        ref={passwordInput}
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password_confirmation">Confirm Password</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        className="form-input"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    {errors.password_confirmation && <p className="form-error">{errors.password_confirmation}</p>}
                </div>

                <div className="form-actions">
                    {saved && <span className="form-status">Saved.</span>}
                    <button className="btn-primary" disabled={processing}>Save</button>
                </div>
            </form>
        </section>
    );
}
