import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm() {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    return (
        <section className="profile-section">
            <h2>Delete Account</h2>
            <p>Once your account is deleted, all of its data will be permanently removed.</p>

            <button className="btn-danger" onClick={() => setConfirming(true)}>
                Delete Account
            </button>

            {confirming && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Are you sure?</h2>
                        <p>Please enter your password to permanently delete your account.</p>

                        <form onSubmit={deleteUser}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="delete_password">Password</label>
                                <input
                                    id="delete_password"
                                    type="password"
                                    className="form-input"
                                    ref={passwordInput}
                                    value={data.password}
                                    placeholder="Password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="form-error">{errors.password}</p>}
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-primary" onClick={closeModal}>Cancel</button>
                                <button className="btn-danger" disabled={processing}>Delete Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
