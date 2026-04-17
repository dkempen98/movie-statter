import '../../css/app.scss'
import GameRow from '@/Components/GameRow'
import HelpBar from '@/Components/HelpBar'
import { usePage } from '@inertiajs/react'
import { useState } from 'react'
import chroma from "chroma-js";
import { FaShareAlt } from "react-icons/fa";

export default function Show() {
    const { game, guesses, score, gameOver } = usePage().props

    function formatPoints(pointDisplay) {
        if(game?.is_currency) {
            pointDisplay = "$" + new Intl.NumberFormat().format(pointDisplay);
        }
        return pointDisplay
    }

    function getScoreColor() {
        if(!(game?.target_score > 0) || score == 0) {
            return 'transparent';
        }
        const scale = chroma.scale(['#910404', '#f5c702', '#00b61e']);
        let diff = Math.abs(score / game.target_score)
        if(diff >= 0.60 && diff <= 1.40 && diff !== 1) {
            let gap = Math.abs(1 - diff);
            diff = 1 - (gap / 0.40);
        } else if (diff !== 1) {
            diff = 0;
        }
        return scale(diff);
    }

    function handleShare() {
        const date = game.date
            ? new Date(game.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : ''

        const lines = [
            `Hit the Marquee - ${date}`,
            '',
        ]

        // Spoilers included
        // game.categories.forEach(category => {
        //     const guess = guesses[category.id]
        //     if (guess?.correct) {
        //         const pts = game.is_currency
        //             ? '$' + new Intl.NumberFormat().format(guess.points)
        //             : `${guess.points} ${game.guess_label}`
        //         lines.push(`${category.display_name}: ${guess.movie?.title} (${pts})`)
        //     } else {
        //         lines.push(`${category.display_name}: —`)
        //     }
        // })
        // lines.push('')


        if (game.target_score > 0) {
            lines.push(`Total:  ${formatPoints(score)}`)
            lines.push(`Target: ${formatPoints(game.target_score)}`)
            lines.push(`Score:  ${formatPoints(score - game.target_score)}`)
        } else {
            lines.push(`Total: ${formatPoints(score)}`)
        }
        lines.push("Guesses: " + Object.keys(guesses).length)

        lines.push('')
        lines.push('Play Here!')
        lines.push(window.location.origin)


        const text = lines.join('\n')

        if (navigator.share) {
            navigator.share({ text })
        } else {
            navigator.clipboard.writeText(text)
        }
    }

    if (!game) {
        return (
            <>
                <HelpBar />
                <p style={{ textAlign: 'center', marginTop: '2rem' }}>No game available today. Check back soon!</p>
            </>
        )
    }

    return (
        <div className="game-container">
                <HelpBar />

                <div
                    className="game-header"
                    style={{
                        borderColor: getScoreColor()
                    }}
                >
                    <span className="game-title">{ game.label }</span>
                    {game.target_score > 0 &&
                        <div className="game-scores">
                            <span>Total:</span><span>{ formatPoints(score) }</span>
                            <span>Target Total:</span><span> { formatPoints(game.target_score) }</span>
                            <span>Score:</span>
                            <span>{ formatPoints(score - game.target_score) }</span>
                        </div>
                    }
                    <small style={{color: "slate", marginTop: ".75em"}}>Get your score close to 0 as possible!</small>
                    {!game.target_score &&
                        <span className="point-total">{ formatPoints(score) }</span>
                    }
                </div>

                {gameOver && (
                    <div className="share-container">
                        <button className="share-button" onClick={handleShare}>
                            <FaShareAlt className="share-button-icon" />
                            Share Results
                        </button>
                    </div>
                )}

                {game.categories.map((category) => (
                    <GameRow
                        key={category.id}
                        game={game}
                        category={category}
                        guess={guesses[category.id] ?? null}
                    />
                ))}

                <div className="game-header footer">
                    <span className="point-total">{ (Object.keys(guesses)).length } { (Object.keys(guesses)).length !== 1 ? 'Guesses' : 'Guess' }</span>
                </div>
            </div>
    )
}