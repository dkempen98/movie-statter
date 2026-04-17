import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <p className="form-hint">This is a secure area. Please confirm your password before continuing.</p>

            <form onSubmit={submit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="form-input"
                        value={data.password}
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <div className="form-actions">
                    <button className="btn-primary" disabled={processing}>Confirm</button>
                </div>
            </form>
        </GuestLayout>
    );
}
