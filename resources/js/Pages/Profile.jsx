import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Profile() {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />
            <div className="profile-page">
                <p>You're logged in!</p>
            </div>
        </AuthenticatedLayout>
    );
}
