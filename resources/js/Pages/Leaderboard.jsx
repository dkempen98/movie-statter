import { Head, usePage } from '@inertiajs/react';

export default function Leaderboard() {
    const { leaders, game } = usePage().props;

    function formatPoints(points) {
        if (game?.is_currency) {
            return '$' + new Intl.NumberFormat().format(points);
        }
        return points;
    }

    return (
        <div className="leaderboard-container">
            <Head title="Leaderboard" />
            <h1>Leaderboard</h1>
            <p>Today's Top Scorers</p>

            <table className="leaderboard">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaders?.length ? [...leaders].map((leader, i) => (
                        <tr key={leader.player_id} className={`leaderboard-${i % 2 === 0 ? 'even' : 'odd'}`}>
                            <td>{i + 1}</td>
                            <td>{leader.name}</td>
                            <td>{formatPoints(leader.closest)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={3}>No scores yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
