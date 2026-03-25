import '../../css/app.scss'
import GameRow from '@/Components/GameRow'
import HelpBar from '@/Components/HelpBar'
import { usePage } from '@inertiajs/react'

export default function Show() {
    const { game, guesses } = usePage().props

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

            {game.categories.map((category) => (
                <GameRow
                    key={category.id}
                    game={game}
                    category={category}
                    guess={guesses[category.id] ?? null}
                />
            ))}
        </div>
    )
}