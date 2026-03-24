import { movieSearch, movieCredits } from '../../api/tmdb_api'
import { useEffect, useRef, useState } from 'react'

export default function Grid() {
    const refOne = useRef(null)
    const [modal, setModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [movies, setMovies] = useState([])
    const [correct, setCorrect] = useState(false)
    const [posterUrl, setPosterUrl] = useState(null)
    const [movieLabel, setMovieLabel] = useState('')

    const xGridIds = [488, 2231, 69597]
    const yGridIds = [489, 2176, 6807]

    let imageUrl = ''
    let movieName = ''

    function handleClickOutside(e) {
        if (e.target && refOne.current && !refOne.current.contains(e.target)) {
            setModal(false)
            setSearchQuery('')
            setMovies([])
        }
    }

    async function movieSelected(movieInfo) {
        imageUrl = 'https://image.tmdb.org/t/p/w200' + movieInfo.poster_path
        movieName = movieInfo.title

        const data = await movieCredits(movieInfo.id)
        if (data) analyzeGuess(data)
    }

    function analyzeGuess(castAndCrew) {
        const xMatch = castAndCrew.cast.some(m => m.id === xGridIds[0]) || castAndCrew.crew.some(m => m.id === xGridIds[0])
        const yMatch = castAndCrew.cast.some(m => m.id === yGridIds[0]) || castAndCrew.crew.some(m => m.id === yGridIds[0])

        if (xMatch && yMatch) {
            setCorrect(true)
            setPosterUrl(imageUrl)
            setMovieLabel(movieName)
        }

        setModal(false)
        setMovies([])
    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true)
        return () => document.removeEventListener('click', handleClickOutside, true)
    }, [])

    useEffect(() => {
        if (modal) {
            document.getElementById('search-bar-input').focus()
        }
    }, [modal])

    useEffect(() => {
        if (!searchQuery) {
            setMovies([])
            return
        }
        const delayCall = setTimeout(async () => {
            const data = await movieSearch(searchQuery)
            if (!data) return
            setMovies(data.results)
        }, 600)
        return () => clearTimeout(delayCall)
    }, [searchQuery])

    return (
        <div>
            <button
                className="grid-square"
                onClick={() => !correct && setModal(true)}
                disabled={correct}
                style={correct ? { backgroundColor: 'green', backgroundImage: `url(${posterUrl})` } : {}}
            >
                {correct && <span className="correct-label">{movieLabel}</span>}
            </button>
            {modal && (
                <div className="overlay">
                    <div className="search-bar-container" ref={refOne}>
                        <input
                            autoComplete="off"
                            type="text"
                            className="search-bar-input"
                            id="search-bar-input"
                            placeholder="Search for a Movie"
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {movies.length > 0 && (
                            <ul className="search-results">
                                {movies.map(movie => {
                                    let label = movie.title
                                    if (movie.release_date) label += ' (' + movie.release_date.substring(0, 4) + ')'
                                    return <li key={movie.id} className="search-results-items" onClick={() => movieSelected(movie)}>{label}</li>
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
