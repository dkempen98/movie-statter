import { Head, usePage, router } from '@inertiajs/react';
import { FaMinusCircle } from "react-icons/fa";
import {useEffect, useState} from "react";

export default function Leaderboard() {
    const { leaders, game, allTimeLeaders } = usePage().props;

    const trueLeaders = leaders?.filter((leader) => !Number(leader.gave_up))
    const gaveUp = leaders?.filter((leader) => Number(leader.gave_up))

    const [showAll, setShowAll] = useState(false)

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
            <div className="leaderboard-tabs">
                <p
                    className={showAll ? 'leaderboard-tabs-child' : 'leaderboard-tabs-child active'}
                    onClick={() => setShowAll(false)}
                >
                    Today
                </p>
                <p
                    className={showAll ? 'leaderboard-tabs-child active' : 'leaderboard-tabs-child'}
                    onClick={() => setShowAll(true)}
                >
                    All Time
                </p>
            </div>

            <table className="leaderboard">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {!leaders.length && (
                        <tr>
                            <td colSpan={3}>No scores yet.</td>
                        </tr>
                    )}
                    {showAll && (
                        <>
                            {[...allTimeLeaders].map((leader, i) => (
                                <tr key={leader.player_id} className={`leaderboard-${i % 2 === 0 ? 'even' : 'odd'}`}>
                                    <td>{i + 1}</td>
                                    <td>{leader.name}</td>
                                    <td>{formatPoints(leader.closest)}</td>
                                </tr>
                                )
                            )}
                        </>
                    )}
                    {!showAll && (
                        <>
                            {[...trueLeaders].map((leader, i) => (
                                    <tr key={leader.player_id} className={`leaderboard-${i % 2 === 0 ? 'even' : 'odd'}`}>
                                        <td>{i + 1}</td>
                                        <td>{leader.name}</td>
                                        <td>{formatPoints(leader.closest)}</td>
                                    </tr>
                                )
                            )}
                            {[...gaveUp].map((leader, i) => (
                                        <tr key={leader.player_id} className={`leaderboard-${(i + trueLeaders?.length) % 2 === 0 ? 'even' : 'odd'}`}>
                                            <td>{i + trueLeaders?.length + 1}</td>
                                            <td style={{display: "flex", gap: ".5em"}}>
                                                <FaMinusCircle style={{color: "red"}}/> {leader.name}</td>
                                            <td>{formatPoints(leader.closest)}</td>
                                        </tr>
                                    )
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}
