import { router } from '@inertiajs/react'
import { movieSearch, movieCredits } from '@/Helpers/tmdb_api'
import { useEffect, useRef, useState } from 'react'
import { evaluateGuess } from "@/Helpers/GuessEvaluator.js";

export default function GameRow({ game, category, guess = null }) {
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    const [modal, setModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [movies, setMovies] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    function closeModal() {
        setModal(false)
        setSearchQuery('')
        setMovies([])
    }

    function handleClickOutside(e) {
        if (e.target && containerRef.current && !containerRef.current.contains(e.target)) {
            closeModal()
        }
    }

    async function movieSelected(movieInfo) {
        if (isSubmitting) return

        setIsSubmitting(true)
        let wrongString = null;

        try {
            wrongString = await evaluateGuess(movieInfo, category, game)
        } catch (error) {
            console.error(error)
            setIsSubmitting(false)
        }

        if(!wrongString) {
            setModal(false)
        }
        setMovies([])
        setSearchQuery(null)

    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true)

        return () => {
            document.removeEventListener('click', handleClickOutside, true)
        }
    }, [])

    useEffect(() => {
        if (modal && inputRef.current) {
            inputRef.current.focus()
        }
    }, [modal])

    useEffect(() => {
        if (!searchQuery || !searchQuery.trim()) {
            setMovies([])
            return
        }

        const delayCall = setTimeout(async () => {
            const movies = await movieSearch(searchQuery)

            if (!movies) {
                setMovies([])
                return
            }

            setMovies(movies)
        }, 600)

        return () => clearTimeout(delayCall)
    }, [searchQuery])

    return (
        <div>
            <button
                className="game-row"
                onClick={() => !guess?.correct && setModal(true)}
                disabled={guess?.correct}
                style={guess?.correct ? { backgroundColor: 'green' } : {}}
                type="button"
            >
                <div className="category-label">
                    <span>{category.display_name}</span>
                </div>

                {guess?.correct && (
                    <div>
                        <span className="category-label">{guess.movie_title}</span>
                    </div>
                )}

                <div
                    className="poster-image"
                    style={
                        guess?.correct && guess?.poster_url
                            ? { backgroundImage: `url(${guess.poster_url})` }
                            : {}
                    }
                />
            </button>

            {modal && (
                <div className="overlay">
                    <div className="search-bar-container" ref={containerRef}>
                        <input
                            ref={inputRef}
                            autoComplete="off"
                            type="text"
                            className="search-bar-input"
                            placeholder={`Search for a movie for ${category.display_name}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {movies.length > 0 && (
                            <ul className="search-results">
                                {movies.map((movie) => {
                                    let label = movie.title

                                    if (movie.release_date) {
                                        label += ` (${movie.release_date.substring(0, 4)})`
                                    }

                                    return (
                                        <li
                                            key={movie.id}
                                            className="search-results-items"
                                            onClick={() => movieSelected(movie)}
                                        >
                                            {label}
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}