import '../../css/app.scss'
import GameRow from '@/Components/GameRow'
import HelpBar from '@/Components/HelpBar'
import { usePage } from '@inertiajs/react'
import chroma from "chroma-js";

export default function Show() {
    const { game, guesses, score } = usePage().props

    function formatPoints(pointDisplay) {
        if(game?.is_currency) {
            pointDisplay = "$" + new Intl.NumberFormat().format(pointDisplay);
        }
        return pointDisplay
    }

    function getScoreColor() {
        if(!(game?.target_score > 0)) {
            return 'white';
        }
        const scale = chroma.scale(['#910404', '#f5c702', '#00b61e']);
        let diff = Math.abs(score / game.target_score)
        if(diff > 1) {
            diff = 1 - (diff - 1);
        }
        return scale(diff);
    }

    if (!game) {
        return (
            <div className="App">
                <HelpBar />
                <p style={{ textAlign: 'center', marginTop: '2rem' }}>No game available today. Check back soon!</p>
            </div>
        )
    }

    return (
        <div className="App">
            <HelpBar />

            <div className="game-header">
                <span className="game-title">{ game.label }</span>
                {game.target_score > 0 &&
                    <div className="game-scores">
                        <span>Total:</span><span>{ formatPoints(score) }</span>
                        <span>Target Total:</span><span> { formatPoints(game.target_score) }</span>
                        <span>Score:</span>
                        <span style={{
                            color: getScoreColor()
                        }}>
                            { formatPoints(score - game.target_score) }
                        </span>
                    </div>
                }
                {!game.target_score &&
                    <span className="point-total">{ formatPoints(score) }</span>
                }
            </div>


            {game.categories.map((category) => (
                <GameRow
                    key={category.id}
                    game={game}
                    category={category}
                    guess={guesses[category.id] ?? null}
                />
            ))}

            <div className="game-header footer">
                <span className="point-total">{ (Object.keys(guesses)).length } Guesses</span>
            </div>
        </div>
    )
}