import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import MultiSelect, { type OptionGroup } from './MultiSelect';
import { App } from '@capacitor/app';
import { useNavigate, Link } from 'react-router-dom';
// import Navigation from './Navigation';

type DataSource = 'builtin' | 'upload' | null;

interface Question {
    id: number;
    paper: string | null;
    subject: string | null;
    topic: string | null;
    year: string | null;
    passage: string | null;
    question: string | null;
    option_a: string | null;
    option_b: string | null;
    option_c: string | null;
    option_d: string | null;
    correct_option: string | null;
    explanation: string | null;
    image_url?: string | null;
}

interface QuizState {
    questions: Question[];
    selectedAnswers: Record<number, string>;
    submitted: boolean;
    score: number;
}

interface Filters {
    paper: string;
    subjects: string[];
    topics: string[];
    years: string[];
}

interface BuiltinRow {
    paper?: string | null;
    subject?: string | null;
    topic?: string | null;
    year?: string | number | null;
    passage?: string | null;
    question?: string | null;
    option_a?: string | null;
    option_b?: string | null;
    option_c?: string | null;
    option_d?: string | null;
    correct_option?: string | null;
    explanation?: string | null;
    image_url?: string | null;
    [key: string]: unknown;
}

interface UploadedRow {
    Paper?: string | null;
    Subject?: string | null;
    Topic?: string | null;
    Year?: string | number | null;
    Passage?: string | null;
    Question?: string | null;
    'Option A'?: string | null;
    'Option B'?: string | null;
    'Option C'?: string | null;
    'Option D'?: string | null;
    'Correct Answer'?: string | null;
    Explanation?: string | null;
    'Image Url'?: string | null;
}

function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length;
    const newArray = [...array];
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        const temp = newArray[currentIndex];
        newArray[currentIndex] = newArray[randomIndex];
        newArray[randomIndex] = temp;
    }
    return newArray;
}

const transformHeader = (header: string): string => {
    const trimmedHeader = header.trim();
    switch (trimmedHeader) {
        case 'Paper': return 'paper';
        case 'Subject': return 'subject';
        case 'Topic': return 'topic';
        case 'Year': return 'year';
        case 'Passage': return 'passage';
        case 'Question': return 'question';
        case 'Option A': return 'option_a';
        case 'Option B': return 'option_b';
        case 'Option C': return 'option_c';
        case 'Option D': return 'option_d';
        case 'Correct Answer': return 'correct_option';
        case 'Explanation': return 'explanation';
        case 'Image Url': return 'image_url';
        default: return trimmedHeader.toLowerCase().replace(/\s+/g, '_');
    }
};

const normalizeCell = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const str = String(value);
    if (!str.trim()) return null;
    return str.replace(/\\n/g, '\n');
};

const formatText = (text: string | null | number): string => {
    if (text === null || text === undefined || text === '') return '';
    return String(text);
};

const applyFilters = (
    questions: Question[],
    filters: Filters,
    isRandom: boolean,
    questionLimit: number | null
): Question[] => {
    let filtered = [...questions];
    if (filters.paper) filtered = filtered.filter((q) => q.paper === filters.paper);
    if (filters.subjects.length > 0) filtered = filtered.filter((q) => q.subject !== null && filters.subjects.includes(q.subject));
    if (filters.topics.length > 0) filtered = filtered.filter((q) => q.topic !== null && filters.topics.includes(q.topic));
    if (filters.years.length > 0) filtered = filtered.filter((q) => q.year !== null && filters.years.includes(q.year));
    if (isRandom) filtered = shuffleArray(filtered);
    if (questionLimit !== null && questionLimit > 0) filtered = filtered.slice(0, questionLimit);
    return filtered;
};

const calculateScore = (questions: Question[], selectedAnswers: Record<number, string>): number => {
    return questions.reduce((acc, question, index) => {
        const selected = selectedAnswers[index];
        if (!selected || !question.correct_option) return acc;
        if (question.correct_option.toUpperCase() === selected.toUpperCase()) return acc + 1;
        return acc;
    }, 0);
};

const Quiz: React.FC = () => {
    const [dataSource, setDataSource] = useState<DataSource>(null);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [quizState, setQuizState] = useState<QuizState>({
        questions: [],
        selectedAnswers: {},
        submitted: false,
        score: 0,
    });
    const [filters, setFilters] = useState<Filters>({ paper: '', subjects: [], topics: [], years: [] });
    const [isRandom, setIsRandom] = useState<boolean>(false);
    const [questionLimit, setQuestionLimit] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAllQuestions([]);
        setQuizState({ questions: [], selectedAnswers: {}, submitted: false, score: 0 });
        setFilters({ paper: '', subjects: [], topics: [], years: [] });
        setIsRandom(false);
        setQuestionLimit('');
        setError(null);
    }, [dataSource]);

    const navigate = useNavigate();

    useEffect(() => {
        const listener = App.addListener('backButton', ({ canGoBack }) => {
            const currentPath = window.location.pathname;
            if (currentPath === '/quiz') {
                navigate('/');
            } else if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });
        return () => { listener.then((l) => l.remove()); };
    }, [navigate]);

    useEffect(() => {
        const loadBuiltinQuestions = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/upscpyqs.csv');
                if (!response.ok) throw new Error(`Failed to fetch built-in questions (status ${response.status})`);
                const csvText = await response.text();
                if (!csvText.trim()) throw new Error('Built-in CSV is empty.');

                Papa.parse<BuiltinRow>(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    transformHeader,
                    complete: (results) => {
                        const processed: Question[] = results.data.map((row, index) => ({
                            id: index + 1,
                            paper: normalizeCell(row.paper ?? null),
                            subject: normalizeCell(row.subject ?? null),
                            topic: normalizeCell(row.topic ?? null),
                            year: normalizeCell(row.year ?? null),
                            passage: normalizeCell(row.passage ?? null),
                            question: normalizeCell(row.question ?? null),
                            option_a: normalizeCell(row.option_a ?? null),
                            option_b: normalizeCell(row.option_b ?? null),
                            option_c: normalizeCell(row.option_c ?? null),
                            option_d: normalizeCell(row.option_d ?? null),
                            correct_option: normalizeCell(row.correct_option ?? null),
                            explanation: normalizeCell(row.explanation ?? null),
                            image_url: normalizeCell(row.image_url ?? null),
                        }));
                        setAllQuestions(processed);
                        setIsLoading(false);
                    },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error loading built-in questions.');
                setIsLoading(false);
            }
        };

        if (dataSource === 'builtin') void loadBuiltinQuestions();
    }, [dataSource]);

    const handleUploadedCsv = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        setError(null);

        Papa.parse<UploadedRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const processed: Question[] = results.data.map((row, index) => ({
                    id: index + 1,
                    paper: normalizeCell(row.Paper ?? null),
                    subject: normalizeCell(row.Subject ?? null),
                    topic: normalizeCell(row.Topic ?? null),
                    year: normalizeCell(row.Year ?? null),
                    passage: normalizeCell(row.Passage ?? null),
                    question: normalizeCell(row.Question ?? null),
                    option_a: normalizeCell(row['Option A'] ?? null),
                    option_b: normalizeCell(row['Option B'] ?? null),
                    option_c: normalizeCell(row['Option C'] ?? null),
                    option_d: normalizeCell(row['Option D'] ?? null),
                    correct_option: normalizeCell(row['Correct Answer'] ?? null),
                    explanation: normalizeCell(row.Explanation ?? null),
                    image_url: normalizeCell(row['Image Url'] ?? null),
                }));

                if (!processed.length) {
                    setError('Uploaded CSV did not contain any questions.');
                    setAllQuestions([]);
                    setIsLoading(false);
                    return;
                }

                setAllQuestions(processed);
                setIsLoading(false);
            },
            error: (parseError) => {
                setError(`Failed to parse uploaded CSV: ${parseError.message}`);
                setAllQuestions([]);
                setIsLoading(false);
            },
        });
    };

    const startQuiz = (): void => {
        if (!allQuestions.length) {
            setError('No questions available. Please load questions first.');
            return;
        }

        let preparedQuestions = allQuestions;

        if (dataSource === 'builtin') {
            const trimmedLimit = questionLimit.trim();
            const limitNumber = trimmedLimit.length > 0 ? Number.parseInt(trimmedLimit, 10) : Number.NaN;
            const limit = Number.isNaN(limitNumber) ? null : limitNumber;
            preparedQuestions = applyFilters(allQuestions, filters, isRandom, limit);

            if (!preparedQuestions.length) {
                setError('No questions match the selected filters.');
                return;
            }
        }

        setQuizState({ questions: preparedQuestions, selectedAnswers: {}, submitted: false, score: 0 });
        setError(null);
    };

    const handleAnswerSelect = (questionIndex: number, option: string): void => {
        if (quizState.submitted) return;
        setQuizState((prev) => ({
            ...prev,
            selectedAnswers: { ...prev.selectedAnswers, [questionIndex]: option },
        }));
    };

    const downloadAsPdf = (): void => {
        window.print();
    };

    const submitQuiz = (): void => {
        if (quizState.submitted || !quizState.questions.length) return;
        const score = calculateScore(quizState.questions, quizState.selectedAnswers);
        setQuizState((prev) => ({ ...prev, submitted: true, score }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const { value } = event.target;
        setFilters((prev) => ({ ...prev, paper: value, subjects: [], topics: [] }));
    };

    const handleSubjectsChange = (subjects: string[]): void => {
        setFilters((prev) => {
            const base = prev.paper ? allQuestions.filter((q) => q.paper === prev.paper) : allQuestions;
            const validTopics = new Set(
                base
                    .filter(q => subjects.length === 0 || (q.subject !== null && subjects.includes(q.subject)))
                    .map(q => q.topic)
                    .filter((t): t is string => Boolean(t))
            );
            return { ...prev, subjects, topics: prev.topics.filter(t => validTopics.has(t)) };
        });
    };

    const handleTopicsChange = (topics: string[]): void => {
        setFilters((prev) => ({ ...prev, topics }));
    };

    const handleYearsChange = (years: string[]): void => {
        setFilters((prev) => ({ ...prev, years }));
    };

    const availablePapers = useMemo(() => {
        if (dataSource !== 'builtin') return [];
        return Array.from(new Set(allQuestions.map((q) => q.paper).filter((p): p is string => Boolean(p)))).sort();
    }, [allQuestions, dataSource]);

    const availableSubjects = useMemo(() => {
        if (dataSource !== 'builtin') return [];
        const base = filters.paper ? allQuestions.filter((q) => q.paper === filters.paper) : allQuestions;
        return Array.from(new Set(base.map((q) => q.subject).filter((s): s is string => Boolean(s)))).sort();
    }, [allQuestions, dataSource, filters.paper]);

    const availableTopics = useMemo(() => {
        if (dataSource !== 'builtin') return [];
        let base = filters.paper ? allQuestions.filter((q) => q.paper === filters.paper) : allQuestions;
        if (filters.subjects.length > 0) base = base.filter((q) => q.subject !== null && filters.subjects.includes(q.subject));
        return Array.from(new Set(base.map((q) => q.topic).filter((t): t is string => Boolean(t)))).sort();
    }, [allQuestions, dataSource, filters.paper, filters.subjects]);

    const topicGroups = useMemo((): OptionGroup[] | null => {
        if (dataSource !== 'builtin' || filters.subjects.length < 2) return null;
        const base = filters.paper ? allQuestions.filter((q) => q.paper === filters.paper) : allQuestions;
        return filters.subjects
            .map(subject => ({
                label: subject,
                options: Array.from(new Set(
                    base.filter(q => q.subject === subject).map(q => q.topic).filter((t): t is string => Boolean(t))
                )).sort(),
            }))
            .filter(g => g.options.length > 0);
    }, [allQuestions, dataSource, filters.paper, filters.subjects]);

    const availableYears = useMemo(() => {
        if (dataSource !== 'builtin') return [];
        return Array.from(new Set(allQuestions.map((q) => q.year).filter((y): y is string => Boolean(y)))).sort(
            (a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10)
        );
    }, [allQuestions, dataSource]);

    const totalQuestions = quizState.questions.length;
    const answeredCount = Object.keys(quizState.selectedAnswers).length;
    const percentage = totalQuestions > 0 ? ((quizState.score / totalQuestions) * 100).toFixed(1) : '0.0';

    // Score colour helper
    const scoreColor = (): string => {
        const pct = parseFloat(percentage);
        if (pct >= 70) return 'var(--green)';
        if (pct >= 40) return '#B45309';
        return 'var(--red)';
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.45rem 0.7rem',
        fontSize: '0.85rem',
        border: '1.5px solid var(--border)',
        borderRadius: '6px',
        background: 'var(--surface)',
        color: 'var(--ink)',
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: '0.3rem',
    };

    return (
        <>
            {/* <Navigation /> */}

            {/* ─── Design system styles (same as Pyqs.tsx) ─── */}
            <style>{`
                .page-title {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(1.7rem, 5vw, 2.6rem);
                    font-weight: 900;
                    color: var(--ink);
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                }
                .page-title span { color: var(--blue); }

                .page-subtitle {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 500;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: var(--ink-muted);
                    margin-bottom: 0.35rem;
                }

                .title-rule {
                    width: 3rem;
                    height: 3px;
                    background: var(--blue);
                    border-radius: 2px;
                    margin-top: 0.6rem;
                }

                .btn {
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 600;
                    font-size: 0.82rem;
                    letter-spacing: 0.04em;
                    border-radius: 6px;
                    padding: 0.5rem 1.1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    cursor: pointer;
                    transition: background 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.1s;
                    white-space: nowrap;
                    border: 1.5px solid transparent;
                    text-decoration: none;
                }
                .btn:active { transform: translateY(1px); }

                .btn-primary {
                    background: var(--blue);
                    color: #fff;
                    border-color: var(--blue);
                    box-shadow: 0 2px 8px rgba(26,86,160,0.22);
                }
                .btn-primary:hover {
                    background: var(--blue-hover);
                    border-color: var(--blue-hover);
                    box-shadow: 0 4px 14px rgba(26,86,160,0.32);
                }
                .btn-primary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: transparent;
                    color: var(--ink);
                    border-color: var(--border);
                }
                .btn-secondary:hover {
                    background: var(--paper-alt);
                    border-color: var(--ink-muted);
                }

                /* Source toggle — active state */
                .btn-source {
                    background: var(--paper-alt);
                    color: var(--ink-muted);
                    border-color: var(--border);
                    flex: 1;
                    justify-content: center;
                }
                .btn-source:hover { background: var(--blue-lt); border-color: var(--blue); color: var(--blue); }
                .btn-source.active {
                    background: var(--blue);
                    color: #fff;
                    border-color: var(--blue);
                    box-shadow: 0 2px 8px rgba(26,86,160,0.22);
                }

                /* Start / Submit — green */
                .btn-green {
                    background: var(--green);
                    color: #fff;
                    border-color: var(--green);
                    box-shadow: 0 2px 8px rgba(46,125,82,0.2);
                    padding: 0.55rem 1.6rem;
                }
                .btn-green:hover:not(:disabled) {
                    background: #205A3A;
                    border-color: #205A3A;
                }
                .btn-green:disabled { opacity: 0.38; cursor: not-allowed; }

                .btn-sm { font-size: 0.76rem; padding: 0.35rem 0.8rem; }

                .card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
                }

                /* Sticky progress bar */
                .sticky-bar {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: var(--surface);
                    border-bottom: 1px solid var(--border);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }

                /* Progress track */
                .progress-track {
                    flex: 1;
                    height: 6px;
                    background: var(--paper-alt);
                    border-radius: 99px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--blue);
                    border-radius: 99px;
                    transition: width 0.3s ease;
                }

                /* Score badge */
                .score-badge {
                    font-family: 'Playfair Display', serif;
                    font-size: 2.8rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .print-only { display: none; }

                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: #fff !important; }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #ccc !important;
                        break-inside: avoid;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .sticky-bar { display: none !important; }
                }
            `}</style>

            <div
                className="container mx-auto px-3 sm:px-5 py-3 sm:py-5"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* ── Header ── */}
                <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="page-subtitle">Civil Services Examination</p>
                        <h1 className="page-title">
                            UPSC&nbsp;<span>Quiz</span>
                        </h1>
                        <div className="title-rule" />
                    </div>
                    <Link to="/" className="btn btn-secondary btn-sm no-print" style={{ alignSelf: 'flex-start' }}>
                        ← Back to PYQs
                    </Link>
                </div>

                {/* ── Data source toggle ── */}
                <div className="card mb-4 sm:mb-5 p-3 sm:p-4 no-print">
                    <p style={labelStyle as React.CSSProperties}>Select question source</p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                        <button
                            type="button"
                            onClick={() => setDataSource('builtin')}
                            className={`btn btn-source${dataSource === 'builtin' ? ' active' : ''}`}
                        >
                            {/* Book icon */}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            Built-in UPSC PYQs
                        </button>
                        <button
                            type="button"
                            onClick={() => setDataSource('upload')}
                            className={`btn btn-source${dataSource === 'upload' ? ' active' : ''}`}
                        >
                            {/* Upload icon */}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                            Upload Your Own CSV
                        </button>
                    </div>

                    {dataSource === null && (
                        <p className="mt-3 text-sm" style={{ color: 'var(--ink-muted)' }}>
                            Choose a source above to begin your quiz.
                        </p>
                    )}
                </div>

                {/* ── Built-in filters ── */}
                {dataSource === 'builtin' && (
                    <div className="card mb-4 sm:mb-5 p-3 sm:p-4 no-print">
                        <p style={{ ...labelStyle, marginBottom: '0.8rem' }}>Filter questions</p>

                        {isLoading && (
                            <p className="text-sm mb-2" style={{ color: 'var(--blue)' }}>Loading questions…</p>
                        )}
                        {error && (
                            <p className="text-sm mb-2 p-2 rounded" style={{ color: 'var(--red)', background: 'var(--red-lt)', border: '1px solid var(--border-red-tint)' }}>
                                {error}
                            </p>
                        )}
                        {!isLoading && !error && !allQuestions.length && (
                            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                                No questions available. Ensure <code>upscpyqs.csv</code> is present.
                            </p>
                        )}

                        {allQuestions.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                    {/* Paper — single select (top-level grouping) */}
                                    <div>
                                        <label htmlFor="paper" style={labelStyle as React.CSSProperties}>Paper</label>
                                        <select
                                            id="paper"
                                            name="paper"
                                            value={filters.paper}
                                            onChange={handleFilterChange}
                                            style={selectStyle}
                                        >
                                            <option value="">All Papers</option>
                                            {availablePapers.map((p) => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <MultiSelect
                                        label="Subject"
                                        selected={filters.subjects}
                                        onChange={handleSubjectsChange}
                                        options={availableSubjects}
                                        placeholder={filters.paper ? 'All Subjects for Paper' : 'All Subjects'}
                                        disabled={!availableSubjects.length}
                                    />
                                    <MultiSelect
                                        label="Topic"
                                        selected={filters.topics}
                                        onChange={handleTopicsChange}
                                        options={topicGroups ? undefined : availableTopics}
                                        groups={topicGroups ?? undefined}
                                        placeholder={filters.subjects.length > 0 ? 'All Topics for Subject' : 'All Topics'}
                                        disabled={!availableTopics.length}
                                    />
                                    <MultiSelect
                                        label="Year"
                                        selected={filters.years}
                                        onChange={handleYearsChange}
                                        options={availableYears}
                                        placeholder="All Years"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>
                                        <input
                                            type="checkbox"
                                            checked={isRandom}
                                            onChange={(e) => setIsRandom(e.target.checked)}
                                            style={{ accentColor: 'var(--blue)', width: '1rem', height: '1rem' }}
                                        />
                                        Random order
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--ink)' }}>
                                        <span style={{ fontWeight: 500 }}>Question limit:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={questionLimit}
                                            onChange={(e) => setQuestionLimit(e.target.value)}
                                            placeholder="All"
                                            style={{
                                                width: '5rem',
                                                padding: '0.35rem 0.5rem',
                                                border: '1.5px solid var(--border)',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontFamily: "'DM Sans', sans-serif",
                                                background: 'var(--surface)',
                                                color: 'var(--ink)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Upload CSV ── */}
                {dataSource === 'upload' && (
                    <div className="card mb-4 sm:mb-5 p-3 sm:p-4 no-print">
                        <p style={{ ...labelStyle, marginBottom: '0.8rem' }}>Upload quiz CSV</p>
                        <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1.5rem',
                            border: '2px dashed var(--border)',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            background: 'var(--paper-alt)',
                            color: 'var(--ink-muted)',
                            fontSize: '0.85rem',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                            <span>Click to choose a CSV file</span>
                            <input type="file" accept=".csv" onChange={handleUploadedCsv} disabled={isLoading} style={{ display: 'none' }} />
                        </label>

                        {isLoading && <p className="mt-2 text-sm" style={{ color: 'var(--blue)' }}>Parsing CSV…</p>}
                        {error && (
                            <p className="mt-2 text-sm p-2 rounded" style={{ color: 'var(--red)', background: 'var(--red-lt)', border: '1px solid var(--border-red-tint)' }}>
                                {error}
                            </p>
                        )}
                        {!isLoading && !error && allQuestions.length > 0 && (
                            <p className="mt-2 text-sm" style={{ color: 'var(--green)', fontWeight: 500 }}>
                                ✓ {allQuestions.length} questions loaded
                            </p>
                        )}
                    </div>
                )}

                {/* ── Start Quiz button ── */}
                {dataSource !== null && (
                    <div className="flex justify-center mb-6 sm:mb-8 no-print">
                        <button
                            type="button"
                            onClick={startQuiz}
                            disabled={isLoading || (dataSource === 'upload' && !allQuestions.length)}
                            className="btn btn-green"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Start Quiz
                        </button>
                    </div>
                )}

                {/* ── Active quiz ── */}
                {!quizState.submitted && quizState.questions.length > 0 && (
                    <div className="max-w-3xl mx-auto no-print">
                        {/* Sticky progress bar */}
                        <div className="sticky-bar">
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                                />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'var(--blue)' }}>{answeredCount}</span> / {totalQuestions}
                            </span>
                            <button type="button" onClick={submitQuiz} className="btn btn-green btn-sm">
                                Submit Quiz
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {quizState.questions.map((question, index) => (
                                <div key={question.id} className="card p-4 sm:p-5">
                                    {/* Header */}
                                    <div className="mb-3 pb-2 flex justify-between items-baseline" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                                            Question {index + 1}
                                        </h2>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', background: 'var(--paper-alt)', padding: '0.18rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                            ID {question.id}{question.paper && ` · ${question.paper}`}{question.year && ` · ${question.year}`}
                                        </span>
                                    </div>

                                    {/* Passage */}
                                    {question.passage && (
                                        <div className="mb-3 p-3 rounded" style={{ background: 'var(--paper-alt)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.3rem' }}>Passage</p>
                                            <p className="whitespace-pre-line" style={{ color: 'var(--ink)' }}>{formatText(question.passage)}</p>
                                        </div>
                                    )}

                                    {/* Image */}
                                    {question.image_url && (
                                        <div className="mb-3 text-center">
                                            <img src={`/${question.image_url}`} alt="Question related" className="inline-block max-w-full h-auto rounded" style={{ border: '1px solid var(--border)' }} />
                                        </div>
                                    )}

                                    {/* Question text */}
                                    <p className="mb-4 whitespace-pre-line" style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                                        {formatText(question.question)}
                                    </p>

                                    {/* Options */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                            const optionKey = `option_${letter.toLowerCase()}` as keyof Question;
                                            const isSelected = quizState.selectedAnswers[index] === letter;
                                            return (
                                                <button
                                                    key={letter}
                                                    type="button"
                                                    onClick={() => handleAnswerSelect(index, letter)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '0.6rem',
                                                        padding: '0.6rem 0.85rem',
                                                        borderRadius: '7px',
                                                        border: `1.5px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                                                        background: isSelected ? 'var(--blue-lt)' : 'var(--surface)',
                                                        color: isSelected ? 'var(--blue)' : 'var(--ink)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '0.9rem',
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        transition: 'background 0.15s, border-color 0.15s',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 700, minWidth: '1.2rem' }}>{letter})</span>
                                                    <span className="whitespace-pre-line">{formatText(question[optionKey] ?? '')}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom submit */}
                        <div className="mt-8 flex justify-center">
                            <button type="button" onClick={submitQuiz} className="btn btn-green" style={{ padding: '0.65rem 2rem', fontSize: '0.9rem' }}>
                                Submit Quiz ({answeredCount}/{totalQuestions} answered)
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Results ── */}
                {quizState.submitted && (
                    <div className="max-w-3xl mx-auto">

                        {/* Print-only filter summary */}
                        <div className="print-only card p-4 mb-5" style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--ink)' }}>
                                Quiz Summary
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.15rem 2rem', color: 'var(--ink)' }}>
                                <span><strong>Source:</strong> {dataSource === 'builtin' ? 'Built-in UPSC PYQs' : 'Custom CSV'}</span>
                                <span><strong>Total Questions:</strong> {totalQuestions}</span>
                                {filters.paper && <span><strong>Paper:</strong> {filters.paper}</span>}
                                {filters.subjects.length > 0 && <span><strong>Subjects:</strong> {filters.subjects.join(', ')}</span>}
                                {filters.topics.length > 0 && <span><strong>Topics:</strong> {filters.topics.join(', ')}</span>}
                                {filters.years.length > 0 && <span><strong>Years:</strong> {filters.years.join(', ')}</span>}
                                {questionLimit && <span><strong>Question Limit:</strong> {questionLimit}</span>}
                                {isRandom && <span><strong>Order:</strong> Random</span>}
                                <span><strong>Score:</strong> {quizState.score} / {totalQuestions} ({percentage}%)</span>
                                <span><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Score card */}
                        <div className="card p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div style={{ textAlign: 'center', minWidth: '8rem' }}>
                                <p className="score-badge" style={{ color: scoreColor() }}>{percentage}%</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {quizState.score} / {totalQuestions} correct
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="title-rule" style={{ marginBottom: '0.6rem' }} />
                                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>
                                    Quiz Results
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                                    {parseFloat(percentage) >= 70 ? 'Great work! Keep practising to strengthen weak areas.' :
                                     parseFloat(percentage) >= 40 ? 'Good effort. Review the explanations below to improve.' :
                                     'Keep going — every attempt builds familiarity with the syllabus.'}
                                </p>
                            </div>
                            <div className="flex gap-2 no-print" style={{ alignSelf: 'flex-start' }}>
                                <button type="button" onClick={startQuiz} className="btn btn-primary">
                                    Retry
                                </button>
                                <button type="button" onClick={downloadAsPdf} className="btn btn-secondary">
                                    {/* Download icon */}
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    Download PDF
                                </button>
                            </div>
                        </div>

                        {/* Question review */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {quizState.questions.map((question, index) => {
                                const selected = quizState.selectedAnswers[index];
                                const correctLetter = question.correct_option ? question.correct_option.toUpperCase() : null;
                                const isCorrectAnswer = selected && correctLetter && selected.toUpperCase() === correctLetter;

                                return (
                                    <div key={question.id} className="card p-4 sm:p-5">
                                        {/* Header */}
                                        <div className="mb-3 pb-2 flex justify-between items-baseline" style={{ borderBottom: '1px solid var(--border)' }}>
                                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Question {index + 1}
                                                {isCorrectAnswer
                                                    ? <span style={{ fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: 'var(--green-lt)', color: 'var(--green)', padding: '0.15rem 0.55rem', borderRadius: '20px', border: '1px solid var(--border-green-soft)' }}>✓ Correct</span>
                                                    : <span style={{ fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: 'var(--red-lt)', color: 'var(--red)', padding: '0.15rem 0.55rem', borderRadius: '20px', border: '1px solid var(--border-red-tint)' }}>✗ Incorrect</span>
                                                }
                                            </h3>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', background: 'var(--paper-alt)', padding: '0.18rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                                ID {question.id}{question.paper && ` · ${question.paper}`}{question.year && ` · ${question.year}`}
                                            </span>
                                        </div>

                                        {/* Passage */}
                                        {question.passage && (
                                            <div className="mb-3 p-3 rounded" style={{ background: 'var(--paper-alt)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                                                <p style={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.3rem' }}>Passage</p>
                                                <p className="whitespace-pre-line" style={{ color: 'var(--ink)' }}>{formatText(question.passage)}</p>
                                            </div>
                                        )}

                                        {/* Image */}
                                        {question.image_url && (
                                            <div className="mb-3 text-center">
                                                <img src={`/${question.image_url}`} alt="Question related" className="inline-block max-w-full h-auto rounded" style={{ border: '1px solid var(--border)' }} />
                                            </div>
                                        )}

                                        <p className="mb-3 whitespace-pre-line" style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                                            {formatText(question.question)}
                                        </p>

                                        {/* Options */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                                const optionKey = `option_${letter.toLowerCase()}` as keyof Question;
                                                const isCorrect = correctLetter === letter;
                                                const isUserSelected = selected === letter;

                                                let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--ink)';
                                                if (isCorrect) { bg = 'var(--green-lt)'; border = 'var(--border-green-strong)'; color = 'var(--green)'; }
                                                else if (isUserSelected && !isCorrect) { bg = 'var(--red-lt)'; border = 'var(--border-red-tint)'; color = 'var(--red)'; }

                                                return (
                                                    <div
                                                        key={letter}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '0.6rem',
                                                            padding: '0.55rem 0.85rem',
                                                            borderRadius: '7px',
                                                            border: `1.5px solid ${border}`,
                                                            background: bg,
                                                            color,
                                                            fontSize: '0.88rem',
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 700, minWidth: '1.2rem' }}>{letter})</span>
                                                        <span className="whitespace-pre-line flex-1">{formatText(question[optionKey] ?? '')}</span>
                                                        {isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--green)' }}>✓</span>}
                                                        {isUserSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--red)' }}>✗</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Explanation */}
                                        {question.explanation && (
                                            <div className="p-3 rounded" style={{ background: 'var(--blue-lt)', border: '1px solid var(--border-blue-tint)' }}>
                                                <p style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: '0.4rem', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explanation</p>
                                                <p className="whitespace-pre-line" style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>{formatText(question.explanation)}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Quiz;