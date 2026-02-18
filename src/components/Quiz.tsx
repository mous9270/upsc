import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { App } from '@capacitor/app';

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
    subject: string;
    topic: string;
    year: string;
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
    if (filters.subject) filtered = filtered.filter((q) => q.subject === filters.subject);
    if (filters.topic) filtered = filtered.filter((q) => q.topic === filters.topic);
    if (filters.year) filtered = filtered.filter((q) => q.year === filters.year);
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
    const [filters, setFilters] = useState<Filters>({ paper: '', subject: '', topic: '', year: '' });
    const [isRandom, setIsRandom] = useState<boolean>(false);
    const [questionLimit, setQuestionLimit] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAllQuestions([]);
        setQuizState({ questions: [], selectedAnswers: {}, submitted: false, score: 0 });
        setFilters({ paper: '', subject: '', topic: '', year: '' });
        setIsRandom(false);
        setQuestionLimit('');
        setError(null);
    }, [dataSource]);

 

// Inside your Quiz component, add this useEffect:
useEffect(() => {
    const handleBackButton = App.addListener('backButton', () => {
        if (quizState.questions.length > 0 && !quizState.submitted) {
            // User is in an active quiz — go back to home (reset state)
            setQuizState({ questions: [], selectedAnswers: {}, submitted: false, score: 0 });
            setDataSource(null);
        } else {
            // No active quiz, exit the app
            App.exitApp();
        }
    });

    return () => {
        handleBackButton.then((listener) => listener.remove());
    };
}, [quizState.questions.length, quizState.submitted]);

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

    const submitQuiz = (): void => {
        if (quizState.submitted || !quizState.questions.length) return;
        const score = calculateScore(quizState.questions, quizState.selectedAnswers);
        setQuizState((prev) => ({ ...prev, submitted: true, score }));
        // Scroll to top to show results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const { name, value } = event.target;
        setFilters((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'paper') { next.subject = ''; next.topic = ''; }
            else if (name === 'subject') { next.topic = ''; }
            return next;
        });
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
        if (filters.subject) base = base.filter((q) => q.subject === filters.subject);
        return Array.from(new Set(base.map((q) => q.topic).filter((t): t is string => Boolean(t)))).sort();
    }, [allQuestions, dataSource, filters.paper, filters.subject]);

    const availableYears = useMemo(() => {
        if (dataSource !== 'builtin') return [];
        return Array.from(new Set(allQuestions.map((q) => q.year).filter((y): y is string => Boolean(y)))).sort(
            (a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10)
        );
    }, [allQuestions, dataSource]);

    const totalQuestions = quizState.questions.length;
    const answeredCount = Object.keys(quizState.selectedAnswers).length;
    const percentage = totalQuestions > 0 ? ((quizState.score / totalQuestions) * 100).toFixed(1) : '0.0';

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">
                <a href="/">UPSC Quiz</a>
            </h1>

            {/* Data source buttons */}
            <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    type="button"
                    onClick={() => setDataSource('builtin')}
                    className={`px-4 py-2 rounded-md border text-sm font-medium ${dataSource === 'builtin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                >
                    Use Built-in UPSC PYQs
                </button>
                <button
                    type="button"
                    onClick={() => setDataSource('upload')}
                    className={`px-4 py-2 rounded-md border text-sm font-medium ${dataSource === 'upload' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                >
                    Upload Your Own CSV
                </button>
            </div>

            {dataSource === null && (
                <p className="text-center text-gray-600">Select a data source to begin your UPSC Prelims quiz.</p>
            )}

            {/* Built-in filters */}
            {dataSource === 'builtin' && (
                <div className="max-w-3xl mx-auto mb-6 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-3">Built-in Question Filters</h2>
                    {isLoading && <p className="text-blue-600 text-sm mb-2">Loading built-in questions...</p>}
                    {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                    {!isLoading && !error && !allQuestions.length && (
                        <p className="text-gray-500 text-sm">No built-in questions available. Ensure `upscpyqs.csv` is present.</p>
                    )}
                    {allQuestions.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label htmlFor="paper" className="block text-sm font-medium text-gray-700 mb-1">Paper</label>
                                    <select id="paper" name="paper" value={filters.paper} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                                        <option value="">All Papers</option>
                                        {availablePapers.map((paper) => <option key={paper} value={paper}>{paper}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select id="subject" name="subject" value={filters.subject} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md p-2 text-sm" disabled={!availableSubjects.length}>
                                        <option value="">{filters.paper ? 'All Subjects for Paper' : 'All Subjects'}</option>
                                        {availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                    <select id="topic" name="topic" value={filters.topic} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md p-2 text-sm" disabled={!availableTopics.length}>
                                        <option value="">{filters.subject ? 'All Topics for Subject' : 'All Topics'}</option>
                                        {availableTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <select id="year" name="year" value={filters.year} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                                        <option value="">All Years</option>
                                        {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <label className="inline-flex items-center text-sm text-gray-700">
                                    <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2" checked={isRandom} onChange={(e) => setIsRandom(e.target.checked)} />
                                    Random order
                                </label>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-700">Question limit (optional):</span>
                                    <input type="number" min={1} value={questionLimit} onChange={(e) => setQuestionLimit(e.target.value)} className="w-20 border border-gray-300 rounded-md p-1 text-sm" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Upload CSV */}
            {dataSource === 'upload' && (
                <div className="max-w-md mx-auto mb-6 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-3">Upload Quiz CSV</h2>
                    <input type="file" accept=".csv" onChange={handleUploadedCsv} className="w-full p-2 border border-gray-300 rounded text-sm" disabled={isLoading} />
                    {isLoading && <p className="mt-2 text-blue-600 text-sm">Parsing uploaded CSV...</p>}
                    {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
                    {!isLoading && !error && allQuestions.length > 0 && (
                        <p className="mt-2 text-sm text-gray-700">Loaded {allQuestions.length} questions from uploaded CSV.</p>
                    )}
                </div>
            )}

            {dataSource !== null && (
                <div className="max-w-3xl mx-auto mb-8 flex justify-center">
                    <button
                        type="button"
                        onClick={startQuiz}
                        disabled={isLoading || (dataSource === 'upload' && !allQuestions.length)}
                        className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Start Quiz
                    </button>
                </div>
            )}

            {/* All questions at once */}
            {!quizState.submitted && quizState.questions.length > 0 && (
                <div className="max-w-3xl mx-auto">
                    {/* Sticky progress bar */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3 mb-6 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Answered <span className="text-indigo-600 font-bold">{answeredCount}</span> of <span className="font-bold">{totalQuestions}</span>
                        </span>
                        <button
                            type="button"
                            onClick={submitQuiz}
                            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                        >
                            Submit Quiz
                        </button>
                    </div>

                    <div className="space-y-6">
                        {quizState.questions.map((question, index) => (
                            <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="mb-4 flex justify-between items-baseline">
                                    <h2 className="text-lg font-semibold text-gray-800">Question {index + 1}</h2>
                                    <span className="text-xs text-gray-500">
                                        ID: {question.id}{question.paper && ` | ${question.paper}`}{question.year && ` (${question.year})`}
                                    </span>
                                </div>

                                {question.passage && (
                                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                        <p className="font-semibold mb-1">Passage</p>
                                        <p className="whitespace-pre-line">{formatText(question.passage)}</p>
                                    </div>
                                )}

                                {question.image_url && (
                                    <div className="mb-4 text-center">
                                        <img src={`/${question.image_url}`} alt="Question related" className="inline-block max-w-full h-auto rounded border border-gray-200" />
                                    </div>
                                )}

                                <p className="mb-4 text-base text-gray-900 whitespace-pre-line">{formatText(question.question)}</p>

                                <div className="space-y-3">
                                    {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                        const optionKey = `option_${letter.toLowerCase()}` as keyof Question;
                                        const optionText = question[optionKey];
                                        const isSelected = quizState.selectedAnswers[index] === letter;
                                        return (
                                            <button
                                                key={letter}
                                                type="button"
                                                onClick={() => handleAnswerSelect(index, letter)}
                                                className={`w-full text-left p-3 rounded border text-sm transition-colors ${isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <span className="font-bold mr-2">{letter})</span>
                                                <span className="whitespace-pre-line">{formatText(optionText ?? '')}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit button at bottom */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={submitQuiz}
                            className="px-8 py-3 rounded-md bg-green-600 text-white text-base font-medium hover:bg-green-700"
                        >
                            Submit Quiz ({answeredCount}/{totalQuestions} answered)
                        </button>
                    </div>
                </div>
            )}

            {/* Results */}
            {quizState.submitted && (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-2">Quiz Results</h2>
                        <p className="text-lg mb-1">Score: {quizState.score} / {totalQuestions}</p>
                        <p className="text-gray-700">Percentage: {percentage}%</p>
                    </div>

                    <div className="space-y-4">
                        {quizState.questions.map((question, index) => {
                            const selected = quizState.selectedAnswers[index];
                            const correctLetter = question.correct_option ? question.correct_option.toUpperCase() : null;
                            return (
                                <div key={question.id} className="bg-white rounded-lg shadow-md p-5">
                                    <div className="mb-3 flex justify-between items-baseline">
                                        <h3 className="text-base font-semibold text-gray-800">Question {index + 1}</h3>
                                        <span className="text-xs text-gray-500">
                                            ID: {question.id}{question.paper && ` | ${question.paper}`}{question.year && ` (${question.year})`}
                                        </span>
                                    </div>
                                    {question.passage && (
                                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                                            <p className="font-semibold mb-1">Passage</p>
                                            <p className="whitespace-pre-line">{formatText(question.passage)}</p>
                                        </div>
                                    )}
                                    {question.image_url && (
                                        <div className="mb-3 text-center">
                                            <img src={`/${question.image_url}`} alt="Question related" className="inline-block max-w-full h-auto rounded border border-gray-200" />
                                        </div>
                                    )}
                                    <p className="mb-3 text-sm text-gray-900 whitespace-pre-line">{formatText(question.question)}</p>
                                    <div className="space-y-2 mb-3">
                                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                            const optionKey = `option_${letter.toLowerCase()}` as keyof Question;
                                            const optionText = question[optionKey];
                                            const isCorrect = correctLetter === letter;
                                            const isSelected = selected === letter;

                                            let classes = 'p-2 rounded border text-sm whitespace-pre-line';
                                            if (isCorrect) classes += ' bg-green-100 border-green-400';
                                            else if (isSelected && !isCorrect) classes += ' bg-red-100 border-red-400';
                                            else classes += ' bg-white border-gray-300';

                                            return (
                                                <div key={letter} className={classes}>
                                                    <span className="font-bold mr-2">{letter})</span>
                                                    {formatText(optionText ?? '')}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {question.explanation && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                            <p className="font-semibold text-blue-800 mb-1 text-sm">Explanation</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{formatText(question.explanation)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quiz;