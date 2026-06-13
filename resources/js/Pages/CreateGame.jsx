import '../../css/app.scss'
import { usePage, router } from '@inertiajs/react'
import { useEffect, useReducer, useRef, useState } from 'react'
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
    date: null,
    scoringType: 'revenue',
    categories: [],
    targetScore: '',
}

function reducer(draft, action) {
    switch (action.type) {
        case 'SET_DATE':
            return { ...draft, date: action.date }

        case 'SET_TARGET':
            return { ...draft, targetScore: action.value }

        case 'ADD_CATEGORY':
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

    return (
        <div className="game-create">
            <h1>Create Game</h1>

            {step === 0 && (
                <DateStep
                    date={date}
                    takenDates={takenDates}
                    onChange={(d) => dispatch({ type: 'SET_DATE', date: d })}
                />
            )}

            {step === 1 && (
                <CategoryStep
                    draft={draft}
                    dispatch={dispatch}
                    lastDecades={lastDecades}
                    lastYears={lastYears}
                    lastGenres={lastGenres}
                />
            )}

            {step === 1 && (
                <div>
                    <h2>Revenue Target</h2>
                    <input
                        type="number"
                        value={draft.targetScore}
                        onChange={(e) => dispatch({ type: 'SET_TARGET', value: e.target.value })}
                        placeholder="Target score"
                    />
                </div>
            )}

            {step === 2 && <ReviewStep draft={draft} />}

            <div>
                {step > 0 && <button onClick={() => setStep(step - 1)}>Back</button>}
                {step < 2 && <button onClick={() => setStep(step + 1)}>Next</button>}
                {step === 2 && (
                    <button onClick={() => router.post('/games', toPayload(draft))}>
                        Create Game
                    </button>
                )}
            </div>
        </div>
    )
}

function toPayload(draft) {
    return {
        date: draft.date,
        scoringType: draft.scoringType,
        targetScore: draft.targetScore,
        categories: draft.categories.map((c) => ({
            type: c.type,
            value: c.value,
            displayName: c.displayName,
            qualifiers: c.qualifiers.map((q) => ({
                type: q.type,
                value: q.value,
                isDisqualifier: q.isDisqualifier,
            })),
        })),
    }
}

function DateStep({ date, takenDates, onChange }) {
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
        <div>
            <h2>Game Date</h2>
            <input ref={inputRef} type="text" placeholder="Select a date" readOnly />
        </div>
    )
}

function CategoryStep({ draft, dispatch, lastDecades, lastYears, lastGenres }) {
    return (
        <div>
            <h2>
                Categories ({draft.categories.length}/{MAX_CATEGORIES})
            </h2>

            <ul>
                {draft.categories.map((c) => (
                    <li key={c.id}>
                        <strong>{c.displayName}</strong>
                        <button onClick={() => dispatch({ type: 'REMOVE_CATEGORY', id: c.id })}>
                            remove
                        </button>
                        <Qualifiers
                            category={c}
                            dispatch={dispatch}
                            lastDecades={lastDecades}
                            lastYears={lastYears}
                            lastGenres={lastGenres}
                        />
                    </li>
                ))}
            </ul>

            {draft.categories.length < MAX_CATEGORIES && (
                <CategoryAdder
                    dispatch={dispatch}
                    lastDecades={lastDecades}
                    lastYears={lastYears}
                    lastGenres={lastGenres}
                />
            )}
        </div>
    )
}

function CategoryAdder({ dispatch, lastDecades, lastYears, lastGenres }) {
    const [type, setType] = useState('cast_or_crew')
    const [pending, setPending] = useState(null) // { value, displayName }

    function add() {
        if (!pending) return
        dispatch({ type: 'ADD_CATEGORY', category: { type, ...pending } })
        setPending(null)
    }

    return (
        <div>
            <h3>Add Category</h3>
            <select
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

            {pending && <span> selected: {pending.displayName} </span>}
            <button onClick={add} disabled={!pending}>
                Add
            </button>
        </div>
    )
}

function Qualifiers({ category, dispatch, lastDecades, lastYears, lastGenres }) {
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
            qualifier: { type, value: pending.value, isDisqualifier },
        })
        setType(null)
        setPending(null)
        setIsDisqualifier(false)
    }

    return (
        <div>
            <ul>
                {category.qualifiers.map((q) => (
                    <li key={q.id}>
                        {q.isDisqualifier ? 'NOT ' : ''}
                        {q.type}: {q.value}
                        <button
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
                    <label>
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
                    <button onClick={add} disabled={!pending}>
                        Add Qualifier
                    </button>
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
                defaultValue=""
                onChange={(e) =>
                    onPick(
                        e.target.value
                            ? { value: e.target.value, displayName: 'Released in ' + e.target.value }
                            : null
                    )
                }
            >
                <option value="">select year</option>
                {lastYears.map((y) => (
                    <option key={y.year} value={y.year}>
                        {y.year} {y.last ? '- Last Used ' + y.last : ''}
                    </option>
                ))}
            </select>
        )
    }

    if (type === 'year_range') {
        return (
            <select
                defaultValue=""
                onChange={(e) =>
                    onPick(
                        e.target.value
                            ? { value: e.target.value, displayName: 'Released in the ' + decadeLabel(e.target.value) }
                            : null
                    )
                }
            >
                <option value="">select decade</option>
                {lastDecades.map((d) => (
                    <option key={d.decade} value={d.decade}>
                        {decadeLabel(d.decade)} {d.last ? '- Last Used ' + d.last : ''}
                    </option>
                ))}
            </select>
        )
    }

    if (type === 'genre') {
        return (
            <select
                defaultValue=""
                onChange={(e) => {
                    const g = lastGenres.find((g) => String(g.tmdb_id) === e.target.value)
                    onPick(g ? { value: String(g.tmdb_id), displayName: g.display_name } : null)
                }}
            >
                <option value="">select genre</option>
                {lastGenres.map((g) => (
                    <option key={g.tmdb_id} value={g.tmdb_id}>
                        {g.display_name} {g.last ? '- Last Used ' + g.last : ''}
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
        <span>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search person"
            />
            <ul>
                {results.map((p) => (
                    <li key={p.id}>
                        <button onClick={() => pickPerson({ value: String(p.id), displayName: p.name })}>
                            {p.name} {p.department ? '(' + p.department + ')' : ''}
                        </button>
                        {p.last_used && <span> — Last Used {p.last_used}</span>}
                    </li>
                ))}
            </ul>
        </span>
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
        <div>
            <h2>Review</h2>
            <p>Date: {draft.date}</p>
            <p>Target: {formatPoints(draft.targetScore)}</p>
            <ul>
                {draft.categories.map((c) => (
                    <li key={c.id}>
                        {c.displayName}
                        {c.qualifiers.length > 0 && (
                            <ul>
                                {c.qualifiers.map((q) => (
                                    <li key={q.id}>
                                        {q.isDisqualifier ? 'NOT ' : ''}
                                        {q.type}: {q.value}
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
