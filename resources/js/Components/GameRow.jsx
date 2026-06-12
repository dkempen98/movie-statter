import { router } from '@inertiajs/react'
import { movieSearch, movieCredits } from '@/Helpers/tmdb_api'
import { useEffect, useRef, useState } from 'react'
import { evaluateGuess } from "@/Helpers/GuessEvaluator.js";
import { FaCamera, FaMinusCircle } from "react-icons/fa";
import ImagePreviewer from "@/Components/ImagePreviewer.jsx";
import clsx from "clsx";
import GiveUpWarning from "./GiveUpWarning.jsx";

export default function GameRow({ game, category, guess = null }) {
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    const [modal, setModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [movies, setMovies] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [incorrectString, setIncorrectString] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [showGiveUp, setShowGiveUp] = useState(false)

    function closeModal() {
        setModal(false)
        setSearchQuery('')
        setMovies([])
    }

    function handleClickOutside(e) {
        if (
            e.target &&
            containerRef.current &&
            !containerRef.current.contains(e.target) &&
            !showPreview &&
            !showGiveUp
        ) {
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
        } finally {
            setIsSubmitting(false)
        }

        if(!wrongString) {
            setModal(false)
        } else {
            setIncorrectString(wrongString)
        }
        setMovies([])
        setSearchQuery('')

    }

    function giveUp() {
        router.post('/guesses', {
            game_id: game.id,
            category_id: category.id,
            tmdb_movie_id: 0,
            movie_title: "Gave Up",
            poster_path: "/b9dVH0n7YnBqLmW2c5AzftxhhpH.jpg",
            backdrop_path: "/wjt1dwtabVm9vujAteDTnXnpHfZ.jpg",
            points: 0,
            correct: true,
        });

        setShowGiveUp(false);
        setModal(false);
    }

    function formatPoints() {
        let pointDisplay = guess.points;
        if(game.is_currency) {
            pointDisplay = "$" + new Intl.NumberFormat().format(guess.points)
        }
        return `${pointDisplay} ${game.guess_label}`
    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true)

        return () => {
            document.removeEventListener('click', handleClickOutside, true)
        }
    }, [showPreview, showGiveUp])

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
        <div className='game-row-container'>
            {modal &&
                <svg height="calc(100% + 4px)" width="calc(100% + 2px)" xmlns="http://www.w3.org/2000/svg">
                    <rect
                        rx="10"
                        ry="10"
                        className="line"
                        height="100%"
                        width="100%"
                        strokeLinejoin="round"
                    />
                </svg>
            }
            <button
                className={clsx('game-row', {
                    'selected': modal
                })}
                onClick={() => !guess?.correct && setModal(true)}
                disabled={guess?.correct}
                style={guess?.correct ?
                    {
                        backgroundColor: `#00000080`,
                        backgroundImage: `url(https://image.tmdb.org/t/p/w780${guess.movie?.backdrop_path})`,
                        borderRadius: `10px 10px 0 0`,
                        marginBottom: '2.5rem',
                    }
                    : {}
                }
                type="button"
            >

                {guess?.correct && (
                    <div className="row-label">
                        <span>{guess.movie?.title}</span>
                        <div className="row-qualifier">{category.display_name}</div>
                        {category?.qualifiers?.map((qualifier) => (
                            <div className="row-qualifier" key={qualifier.id}>
                                {qualifier.display_name}
                            </div>
                        ))}
                    </div>
                )}

                {!guess?.correct && (
                    <div className="row-label">
                        <span>{category.display_name}</span>
                        {category?.qualifiers?.map((qualifier) => (
                            <div className="row-qualifier" key={qualifier.id}>
                                {qualifier.display_name}
                            </div>
                        ))}
                    </div>
                )}

                {/*<div*/}
                {/*    className="poster-image"*/}
                {/*    // style={*/}
                {/*    //     guess?.correct && guess?.movie?.poster_path*/}
                {/*    //         ? { backgroundImage: `url(https://image.tmdb.org/t/p/w92${guess.movie?.poster_path})` }*/}
                {/*    //         : {}*/}
                {/*    // }*/}
                {/*/>*/}

                {guess?.correct && (
                    <div className="row-score">
                        <span>{formatPoints()}</span>
                    </div>
                )}
            </button>

            {modal && (
                <div className="overlay">
                    <div className="search-bar-container" ref={containerRef}>
                        <input
                            ref={inputRef}
                            autoComplete="off"
                            type="text"
                            className="search-bar-input results"
                            placeholder={incorrectString.length > 0 ? incorrectString : category.display_name}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {movies.length === 0 && (
                            <div className="search-results row-button-container">
                                <button className="row-button give-up" onClick={() => setShowGiveUp(true)}>
                                    <FaMinusCircle /> <span>Give Up</span>
                                </button>
                                {category.type === 'cast_or_crew' && (
                                    <button className="row-button view" onClick={() => setShowPreview(true)}>
                                        <FaCamera /> <span>View Photo</span>
                                    </button>
                                )}
                            </div>
                        )}

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
            <GiveUpWarning
                category={ category }
                open={ showGiveUp }
                close={ () => setShowGiveUp(false) }
                giveUp={ () => giveUp() }
            />
            {category.type === 'cast_or_crew' && (
                <ImagePreviewer
                    personId={ category.value }
                    open={ showPreview }
                    close={ () => setShowPreview(false) }
                />
            )}
        </div>
    )
}