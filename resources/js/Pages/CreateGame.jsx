import '../../css/app.scss'
import { usePage, router } from '@inertiajs/react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { FaPencilAlt } from "react-icons/fa";
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'

const CATEGORY_TYPES = [
    { value: 'cast_or_crew', label: 'Cast or Crew' },
    { value: 'year', label: 'Year' },
    { value: 'year_range', label: 'Decade' },
    { value: 'genre', label: 'Genre' },
]

const QUALIFIER_TYPES = ['year', 'year_range', 'genre']
const MAX_CATEGORIES = 5

let idCounter = 0
const newId = (p) => `${p}_${++idCounter}`
const yearBased = (t) => t === 'year' || t === 'year_range'
const decadeLabel = (d) => d.slice(0, 4) + 's'

function eligibleQualifierTypes(categoryType) {
    return QUALIFIER_TYPES.filter(
        (t) => t !== categoryType && !(yearBased(t) && yearBased(categoryType))
    )
}

const initialDraft = {
    game_id: null,
    date: null,
    scoring_type: 'revenue',
    categories: [],
    target_score: '',
}

function reducer(draft, action) {
    switch (action.type) {
        case 'SET_DATE':
            return { ...draft, date: action.date }

        case 'SET_TARGET':
            return { ...draft, target_score: action.value }

        case 'SET_CATEGORIES':
            console.log({
                ...draft,
                categories: action.categories,
            })
            return {
                ...draft,
                categories: action.categories,
            }

        case 'SET_GAME_ID':
            return { ...draft, game_id: action.game_id }

        case 'ADD_CATEGORY':
            console.log({
                ...draft,
                categories: [
                    ...draft.categories,
                    { id: newId('c'), qualifiers: [], ...action.category },
                ],
            })
            return {
                ...draft,
                categories: [
                    ...draft.categories,
                    { id: newId('c'), qualifiers: [], ...action.category },
                ],
            }

        case 'REMOVE_CATEGORY':
            return {
                ...draft,
                categories: draft.categories.filter((c) => c.id !== action.id),
            }

        case 'ADD_QUALIFIER':
            return {
                ...draft,
                categories: draft.categories.map((c) =>
                    c.id === action.categoryId
                        ? { ...c, qualifiers: [...c.qualifiers, { id: newId('q'), ...action.qualifier }] }
                        : c
                ),
            }

        case 'REMOVE_QUALIFIER':
            return {
                ...draft,
                categories: draft.categories.map((c) =>
                    c.id !== action.categoryId
                        ? c
                        : { ...c, qualifiers: c.qualifiers.filter((q) => q.id !== action.qualifierId) }
                ),
            }

        default:
            return draft
    }
}


export default function CreateGame() {
    const { takenDates, date, lastDecades, lastYears, lastGenres } = usePage().props

    const [draft, dispatch] = useReducer(reducer, { ...initialDraft, date })
    const [step, setStep] = useState(0)
    const [addingQualifier, setAddingQualifier] = useState(false)
    const [gameSubmitted, setGameSubmitted] = useState(null)


    function submitGame() {
        try {
            if(draft?.game_id) {
                router.put('/game/'+draft.game_id+'/update', toPayload(draft))
            } else {
                router.post('/games', toPayload(draft))
            }
            setGameSubmitted(true);
        } catch (e) {
            console.error(e);
        }

    }

    async function editGame(date) {
        try {
            let { data } = await axios.get('/game/'+date+'/edit');
            dispatch({ type: 'SET_DATE', date: date })
            dispatch({ type: 'SET_TARGET', value: data.game?.target_score })
            dispatch({ type: 'SET_CATEGORIES', categories: data.game?.categories })
            dispatch({ type: 'SET_GAME_ID', game_id: data.game?.id })
            setStep(1);
        } catch (e) {
            console.error(e);
        }
    }

    function cancelEdit() {
        dispatch({ type: 'SET_DATE', date: null })
        dispatch({ type: 'SET_TARGET', value: '' })
        dispatch({ type: 'SET_CATEGORIES', categories: [] })
        dispatch({ type: 'SET_GAME_ID', game_id: null })
        setStep(0);
    }

    return (
        <div className="game-create">
            <h1 className="game-create-title">Create Game</h1>

            {step === 0 && (
                <DateStep
                    date={date}
                    takenDates={takenDates}
                    onChange={(d) => dispatch({ type: 'SET_DATE', date: d })}
                    editGame={editGame}
                />
            )}

            {step === 1 && (
                <CategoryStep
                    draft={draft}
                    dispatch={dispatch}
                    lastDecades={lastDecades}
                    lastYears={lastYears}
                    lastGenres={lastGenres}
                    usingQualifier={setAddingQualifier}
                />
            )}

            {step === 1 && (
                <div className="game-create-field">
                    <label className="game-create-label">Revenue Target</label>
                    <input
                        className="game-create-input"
                        type="number"
                        disabled={draft?.categories?.length < 5}
                        value={draft.target_score}
                        onChange={(e) => dispatch({ type: 'SET_TARGET', value: e.target.value })}
                        placeholder="Target score"
                    />
                </div>
            )}

            {step === 2 && <ReviewStep draft={draft} />}

            <div className="game-create-actions">
                {step > 0 && !gameSubmitted && !draft?.game_id && (
                    <button className="btn-secondary large" onClick={() => setStep(step - 1)}>Back</button>
                )}
                {step > 0 && !gameSubmitted && draft?.game_id && (
                    <button className="btn-secondary large" onClick={() => cancelEdit()}>Cancel Edit</button>
                )}
                {step < 2 &&
                    <button
                        className="btn-primary large"
                        onClick={() => setStep(step + 1)}
                        disabled={
                            step === 1 &&
                            (
                                !draft?.target_score ||
                                draft?.categories?.length < 5 ||
                                addingQualifier
                            )
                        }
                    >
                        Next
                    </button>
                }
                {step === 2 && !gameSubmitted && (
                    <button className="btn-primary large" onClick={() => submitGame()}>
                        {draft?.game_id ? "Update Game" : "Create Game"}
                    </button>
                )}

                {step === 2 && gameSubmitted && (
                    <div className="game-create-status">
                        <h3>Game Created for { draft.date }!</h3>
                        <button className="btn-primary large" onClick={() => window.location.reload()}>
                            Generate Another
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function toPayload(draft) {
    return {
        date: draft.date,
        scoring_type: draft.scoring_type,
        target_score: draft.target_score,
        categories: draft.categories.map((c) => ({
            type: c.type,
            value: c.value,
            display_name: c.display_name,
            qualifiers: c.qualifiers.map((q) => ({
                type: q.type,
                value: q.value,
                is_disqualifier: q.isDisqualifier,
            })),
        })),
    }
}

function DateStep({ date, takenDates, onChange, editGame }) {
    const inputRef = useRef(null)

    useEffect(() => {
        const fp = flatpickr(inputRef.current, {
            defaultDate: date,
            minDate: 'today',
            disable: takenDates ?? [],
            dateFormat: 'Y-m-d',
            onChange: (_dates, dateStr) => onChange(dateStr),
        })
        return () => fp.destroy()
    }, [date, takenDates])

    return (
        <div className="game-create-field">
            <label className="game-create-label">Game Date</label>
            <input className="game-create-input" ref={inputRef} type="text" placeholder="Select a date" readOnly />
            {takenDates?.length > 0 && (
                <div className="game-edit-container">
                    <ul>
                        {takenDates.map((td) => (
                            <li className="game-edit-button" onClick={() => editGame(td)}>
                                <FaPencilAlt/> {td}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function CategoryStep({ draft, dispatch, lastDecades, lastYears, lastGenres, usingQualifier }) {
    return (
        <div className="category-step">
            <h2 className="game-create-title">
                Categories ({draft.categories.length}/{MAX_CATEGORIES})
            </h2>

            {draft.categories.length < MAX_CATEGORIES && (
                <CategoryAdder
                    dispatch={dispatch}
                    lastDecades={lastDecades}
                    lastYears={lastYears}
                    lastGenres={lastGenres}
                />
            )}

            <ul className="category-list">
                {draft.categories.map((c) => (
                    <li className="category-item" key={c.id + '_' + c.display_name}>
                        <span className="game-category-name">{c.display_name}</span>
                        <button className="btn-danger" onClick={() => dispatch({ type: 'REMOVE_CATEGORY', id: c.id })}>
                            remove
                        </button>
                        <Qualifiers
                            category={c}
                            dispatch={dispatch}
                            lastDecades={lastDecades}
                            lastYears={lastYears}
                            lastGenres={lastGenres}
                            usingQualifier={usingQualifier}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}

function CategoryAdder({ dispatch, lastDecades, lastYears, lastGenres }) {
    const [type, setType] = useState('cast_or_crew')
    const [pending, setPending] = useState(null) // { value, display_name }

    function add() {
        if (!pending) return
        dispatch({ type: 'ADD_CATEGORY', category: { type, ...pending } })
        setPending(null)
    }

    useEffect(() => {
        if(pending && type === 'cast_or_crew') {
            add();
        }
    }, [pending]);

    return (
        <div className="game-create-field">
            <label className="game-create-label">Add Category</label>
            <select
                className="game-create-input"
                value={type}
                onChange={(e) => {
                    setType(e.target.value)
                    setPending(null)
                }}
            >
                {CATEGORY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                ))}
            </select>

            <ValueInput
                type={type}
                lastDecades={lastDecades}
                lastYears={lastYears}
                lastGenres={lastGenres}
                onPick={setPending}
            />

            {type !== 'cast_or_crew' && (
                <button className="btn-primary" onClick={add} disabled={!pending}>
                    Add
                </button>
            )}
        </div>
    )
}

function Qualifiers({ category, dispatch, lastDecades, lastYears, lastGenres, usingQualifier }) {
    const [type, setType] = useState(null)
    const [isDisqualifier, setIsDisqualifier] = useState(false)
    const [pending, setPending] = useState(null)

    const eligible = eligibleQualifierTypes(category.type)
    if (eligible.length === 0) return null

    function add() {
        if (!type || !pending) return
        dispatch({
            type: 'ADD_QUALIFIER',
            categoryId: category.id,
            qualifier: {
                type,
                label: pending.display_name,
                value: pending.value,
                is_disqualifier: isDisqualifier
            },
        })
        clearForm();
    }

    function cancel() {
        clearForm();
    }

    function clearForm() {
        setType(null)
        setPending(null)
        setIsDisqualifier(false)
        usingQualifier(false)
    }

    useEffect(() => {
        if(type) {
            usingQualifier(true)
        }
    }, [type]);

    return (
        <div className="qualifier-group">
            <ul className="qualifier-list">
                {category.qualifiers.map((q) => (
                    <li className="qualifier-item" key={q.id}>
                        <span className="qualifier-label">
                            {q.display_name ?? (q.is_disqualifier ? 'NOT ' : '') + q.type + ": " + q.label}
                        </span>
                        <button
                            className="btn-danger"
                            onClick={() =>
                                dispatch({
                                    type: 'REMOVE_QUALIFIER',
                                    categoryId: category.id,
                                    qualifierId: q.id,
                                })
                            }
                        >
                            remove
                        </button>
                    </li>
                ))}
            </ul>

            <select
                className="game-create-input"
                value={type ?? ''}
                onChange={(e) => {
                    setType(e.target.value || null)
                    setPending(null)
                }}
            >
                <option value="">+ add qualifier</option>
                {eligible.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>

            {type && (
                <>
                    <label className="game-create-check">
                        <input
                            type="checkbox"
                            checked={isDisqualifier}
                            onChange={(e) => setIsDisqualifier(e.target.checked)}
                        />
                        disqualifier
                    </label>
                    <ValueInput
                        type={type}
                        lastDecades={lastDecades}
                        lastYears={lastYears}
                        lastGenres={lastGenres}
                        onPick={setPending}
                    />
                    <div className="game-create-actions">
                        <button className="btn-primary" onClick={add} disabled={!pending}>
                            Add Qualifier
                        </button>
                        <button className="btn-secondary" onClick={() => clearForm()}>
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

function ValueInput({ type, lastDecades, lastYears, lastGenres, onPick }) {
    if (type === 'cast_or_crew') {
        return <PersonSearch onPick={onPick} />
    }

    if (type === 'year') {
        return (
            <select
                className="game-create-input"
                defaultValue=""
                onChange={(e) =>
                    onPick(
                        e.target.value
                            ? { value: e.target.value, display_name: 'Released in ' + e.target.value }
                            : null
                    )
                }
            >
                <option value="">select year</option>
                {lastYears.map((y) => (
                    <option key={y.year} value={y.year}>
                        {y.year} {y.last ? '- ' + y.last : ''}
                    </option>
                ))}
            </select>
        )
    }

    if (type === 'year_range') {
        return (
            <select
                className="game-create-input"
                defaultValue=""
                onChange={(e) =>
                    onPick(
                        e.target.value
                            ? { value: e.target.value, display_name: 'Released in the ' + decadeLabel(e.target.value) }
                            : null
                    )
                }
            >
                <option value="">select decade</option>
                {lastDecades.map((d) => (
                    <option key={d.decade} value={d.decade}>
                        {decadeLabel(d.decade)} {d.last ? '- ' + d.last : ''}
                    </option>
                ))}
            </select>
        )
    }

    if (type === 'genre') {
        return (
            <select
                className="game-create-input"
                defaultValue=""
                onChange={(e) => {
                    const g = lastGenres.find((g) => String(g.tmdb_id) === e.target.value)
                    onPick(g ? { value: String(g.tmdb_id), display_name: g.display_name } : null)
                }}
            >
                <option value="">select genre</option>
                {lastGenres.map((g) => (
                    <option key={g.tmdb_id} value={g.tmdb_id}>
                        {g.display_name} {g.last ? '- ' + g.last : ''}
                    </option>
                ))}
            </select>
        )
    }

    return null
}

function PersonSearch({ onPick }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([])
            return
        }
        const id = setTimeout(() => {
            fetch('/tmdb/search/person?q=' + encodeURIComponent(query))
                .then((r) => r.json())
                .then(setResults)
                .catch(() => setResults([]))
        }, 300)
        return () => clearTimeout(id)
    }, [query])

    function pickPerson(pick) {
        onPick(pick);
        setQuery('');
        setResults([]);
    }

    return (
        <div className="game-search-container">
            <input
                className="game-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search person"
            />
            <ul className="game-search-results">
                {results.map((p) => (
                    <li className="game-search-results-items" key={p.id}>
                        <button onClick={() => pickPerson({ value: String(p.id), display_name: p.name })}>
                            {p.name} {p.department ? '(' + p.department + ')' : ''}
                        </button>
                        {p.last_used && <span> — {p.last_used}</span>}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function ReviewStep({ draft }) {

    function formatPoints(pointDisplay) {
        // if(game?.is_currency) {
        //     pointDisplay = "$" + new Intl.NumberFormat().format(pointDisplay);
        // }
        // return pointDisplay
        return "$" + new Intl.NumberFormat().format(pointDisplay);
    }

    return (
        <div className="review-step">
            <h2 className="game-create-title">Review</h2>
            <p>Date: {draft.date}</p>
            <p>Target: {formatPoints(draft.target_score)}</p>
            <ul className="category-list">
                {draft.categories.map((c) => (
                    <li className="category-item" key={c.id}>
                        <span className="game-category-name">{c.display_name}</span>
                        {c.qualifiers.length > 0 && (
                            <ul className="qualifier-list">
                                {c.qualifiers.map((q) => (
                                    <li className="qualifier-item" key={q.id}>
                                        <span className="qualifier-label">
                                            {q.display_name ?? (q.is_disqualifier ? 'NOT ' : '') + q.type + ": " + q.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
