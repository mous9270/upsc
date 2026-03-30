import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
// Import PapaParse from the installed npm package
import Papa from 'papaparse';
import MultiSelect, { type OptionGroup } from './MultiSelect';

import { AdMob, BannerAdSize, BannerAdPosition} from '@capacitor-community/admob';
// Interface for the Question data structure
// Updated to include optional imageUrl and ensure keys match transformed headers
interface Question {
    id: number; // Will be generated based on row index
    paper: string | null;
    subject: string | null;
    topic: string | null;
    year: string | null; // Keep as string for consistency
    passage: string | null;
    question: string | null; // Allow null for robustness
    option_a: string | null; // Allow null
    option_b: string | null; // Allow null
    option_c: string | null; // Allow null
    option_d: string | null; // Allow null
    correct_option: string | null; // Allow null
    explanation: string | null;
    image_url?: string | null; // Added optional imageUrl
}

interface Filters {
    paper: string;
    subjects: string[];
    topics: string[];
    years: string[];
    id: string;
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}

// Header mapping function for PapaParse
const transformHeader = (header: string): string => {
    // Trim whitespace from headers
    const trimmedHeader = header.trim();
    // Map CSV headers to interface keys
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
        // Keep other headers as they are (lowercase) or handle them if needed
        default: return trimmedHeader.toLowerCase().replace(/\s+/g, '_'); // Basic fallback
    }
};

// Helper function to replace \n with actual line breaks
const formatText = (text: string | null): string => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n');
};

const Pyqs: React.FC = () => {
    // --- State Variables ---
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [isLoadingCsv, setIsLoadingCsv] = useState<boolean>(true);
    const [csvError, setCsvError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({ paper: '', subjects: [], topics: [], years: [], id: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
    const [isRandom, setIsRandom] = useState<boolean>(false);
    const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [submittedIndices, setSubmittedIndices] = useState<Set<number>>(new Set());
    const [jumpToInput, setJumpToInput] = useState<string>('');
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
    const [isFooterOpen, setIsFooterOpen] = useState<boolean>(false);

    // --- Debounce Search Term ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        const initializeAds = async () => {
            // 1. Initialize AdMob (Removed 'requestTrackingAuthorization' to fix error)
            await AdMob.initialize({
                testingDevices: ['YOUR_DEVICE_ID'], // Add your test device ID here if needed
                // initializeForTesting: true, // Remove this line when publishing to Play Store!
            });
    
            // 2. Show the Banner
            await AdMob.showBanner({
                adId: 'ca-app-pub-9069102058764839/6576785393', // Test ID. Replace with real ID later.
                adSize: BannerAdSize.BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
            });
        };
    
        // Only run on native mobile
        if ((window as any).Capacitor) {
            initializeAds();
        }
    }, []);
    // --- Fetch and Parse CSV Data ---
    useEffect(() => {
        const fetchAndParseCsv = async () => {
            setIsLoadingCsv(true);
            setCsvError(null);
            setAllQuestions([]);

            try {
                console.log("Attempting to fetch CSV file...");
                const response = await fetch('/upscpyqs.csv');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - Could not fetch CSV.`);
                }
                const csvText = await response.text();
                console.log("CSV file fetched successfully. Length:", csvText.length);

                if (!csvText || csvText.trim().length === 0) {
                    throw new Error("CSV file is empty");
                }

                // Parse CSV data using PapaParse with header transformation
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    transformHeader: transformHeader,
                    complete: (results) => {
                        console.log("CSV parsing completed. Results:", {
                            dataLength: results.data.length,
                            errors: results.errors,
                            fields: results.meta.fields
                        });

                        if (results.errors.length > 0) {
                            console.error("CSV Parsing Errors:", results.errors);
                            const errorMessages = results.errors.slice(0, 3).map((err: any) => `Row ${err.row}: ${err.message}`).join('; ');
                            setCsvError(`Error parsing CSV: ${errorMessages}... Check console.`);
                            setIsLoadingCsv(false);
                            return;
                        }

                        // Now results.data should have keys like 'paper', 'option_a', etc.
                        // Validate based on transformed keys
                        if (results.data.length > 0) {
                            const firstRow = results.data[0] as any;
                            console.log("First row of data:", firstRow);
                            
                            // Check for essential keys *after* transformation
                            const requiredTransformedKeys: Array<keyof Omit<Question, 'id' | 'image_url'>> = [
                                'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'
                            ];
                            const missingKeys = requiredTransformedKeys.filter(key =>
                                !(key in firstRow) || firstRow[key] === null || firstRow[key] === undefined || firstRow[key] === ''
                            );

                            if (missingKeys.length > 0) {
                                const message = `CSV data is missing essential content after processing: ${missingKeys.join(', ')}. Check CSV file and header mapping.`;
                                console.error(message, "First row data:", firstRow);
                                setCsvError(message);
                                setIsLoadingCsv(false);
                                return;
                            }
                        } else {
                            setCsvError("CSV file is empty or has no data rows.");
                            setIsLoadingCsv(false);
                            return;
                        }

                        // Process data: Generate ID, ensure correct types (esp. string for year)
                        const processedData: Question[] = results.data.map((row: any, index: number) => ({
                            id: index + 1,
                            paper: row.paper ?? null,
                            subject: row.subject ?? null,
                            topic: row.topic ?? null,
                            year: row.year != null ? String(row.year) : null,
                            passage: row.passage ?? null,
                            question: row.question ?? null,
                            option_a: row.option_a ?? null,
                            option_b: row.option_b ?? null,
                            option_c: row.option_c ?? null,
                            option_d: row.option_d ?? null,
                            correct_option: row.correct_option ?? null,
                            explanation: row.explanation ?? null,
                            image_url: row.image_url ?? null,
                        }));

                        console.log("Processed data sample:", processedData.slice(0, 2));
                        setAllQuestions(processedData);
                        setIsLoadingCsv(false);
                    },
                    error: (error: Error) => {
                        console.error("PapaParse Error:", error);
                        setCsvError(`Failed to parse CSV. ${error.message}`);
                        setIsLoadingCsv(false);
                    }
                });

            } catch (err: any) {
                console.error("Error fetching or parsing CSV:", err);
                setCsvError(`Failed to load or process question data. ${err.message}`);
                setAllQuestions([]);
                setIsLoadingCsv(false);
            }
        };

        fetchAndParseCsv();
    }, []);

    // --- Derive Filter Options (computed, no side-effects needed) ---
    const availablePapers = useMemo(() =>
        Array.from(new Set(allQuestions.map(q => q.paper).filter((p): p is string => !!p))).sort(),
        [allQuestions]
    );

    const availableYears = useMemo(() =>
        Array.from(new Set(allQuestions.map(q => q.year).filter((y): y is string => !!y)))
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10)),
        [allQuestions]
    );

    const availableSubjects = useMemo(() => {
        const base = filters.paper ? allQuestions.filter(q => q.paper === filters.paper) : allQuestions;
        return Array.from(new Set(base.map(q => q.subject).filter((s): s is string => !!s))).sort();
    }, [allQuestions, filters.paper]);

    const availableTopics = useMemo(() => {
        let base = filters.paper ? allQuestions.filter(q => q.paper === filters.paper) : allQuestions;
        if (filters.subjects.length > 0) {
            base = base.filter(q => q.subject !== null && filters.subjects.includes(q.subject));
        }
        return Array.from(new Set(base.map(q => q.topic).filter((t): t is string => !!t))).sort();
    }, [allQuestions, filters.paper, filters.subjects]);

    // Group topics by subject — used when 2+ subjects are selected
    const topicGroups = useMemo((): OptionGroup[] | null => {
        if (filters.subjects.length < 2) return null;
        const base = filters.paper ? allQuestions.filter(q => q.paper === filters.paper) : allQuestions;
        return filters.subjects
            .map(subject => ({
                label: subject,
                options: Array.from(new Set(
                    base.filter(q => q.subject === subject).map(q => q.topic).filter((t): t is string => !!t)
                )).sort(),
            }))
            .filter(g => g.options.length > 0);
    }, [allQuestions, filters.paper, filters.subjects]);


    // --- Apply Filters, Search, and Randomization ---
    const updateDisplayedQuestions = useCallback(() => {
        if (isLoadingCsv || csvError || allQuestions.length === 0) {
             setDisplayedQuestions([]);
             setCurrentIndex(0);
             setSelectedOption(null);
             setSubmittedIndices(new Set());
             setJumpToInput('');
             return;
        }

        let filtered = [...allQuestions];

        // Apply filters
        if (filters.paper) {
            filtered = filtered.filter(q => q.paper === filters.paper);
        }
        if (filters.subjects.length > 0) {
            filtered = filtered.filter(q => q.subject !== null && filters.subjects.includes(q.subject));
        }
        if (filters.topics.length > 0) {
            filtered = filtered.filter(q => q.topic !== null && filters.topics.includes(q.topic));
        }
        if (filters.years.length > 0) {
            filtered = filtered.filter(q => q.year !== null && filters.years.includes(q.year));
        }
        if (filters.id) {
            const searchId = parseInt(filters.id, 10);
            if (!isNaN(searchId)) {
                filtered = filtered.filter(q => q.id === searchId);
            }
        }

        // Apply search term (case-insensitive, check for nulls)
        if (debouncedSearchTerm) {
            const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(q =>
                (String(q.question || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.passage || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.option_a || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.option_b || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.option_c || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.option_d || '').toLowerCase().includes(lowerSearchTerm)) ||
                (String(q.explanation || '').toLowerCase().includes(lowerSearchTerm))
            );
        }

        if (isRandom) {
            filtered = shuffleArray(filtered);
        }

        setDisplayedQuestions(filtered);
        setCurrentIndex(0);
        setSelectedOption(null);
        setSubmittedIndices(new Set());
        setJumpToInput('');

    }, [allQuestions, filters, debouncedSearchTerm, isRandom, isLoadingCsv, csvError]);

    // Trigger the update when dependencies change
    useEffect(() => {
        updateDisplayedQuestions();
    }, [updateDisplayedQuestions]);


    // --- Event Handlers ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            if (name === 'paper') return { ...prev, paper: value, subjects: [], topics: [] };
            return { ...prev, [name]: value };
        });
    };

    const handleSubjectsChange = (subjects: string[]) => {
        setFilters(prev => {
            const base = prev.paper ? allQuestions.filter(q => q.paper === prev.paper) : allQuestions;
            const validTopics = new Set(
                base
                    .filter(q => subjects.length === 0 || (q.subject !== null && subjects.includes(q.subject)))
                    .map(q => q.topic)
                    .filter((t): t is string => !!t)
            );
            return { ...prev, subjects, topics: prev.topics.filter(t => validTopics.has(t)) };
        });
    };

    const handleTopicsChange = (topics: string[]) => {
        setFilters(prev => ({ ...prev, topics }));
    };

    const handleYearsChange = (years: string[]) => {
        setFilters(prev => ({ ...prev, years }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleRandomToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsRandom(e.target.checked);
    };

    const handleOptionSelect = (option: string) => {
        if (!submittedIndices.has(currentIndex)) {
            setSelectedOption(option);
        }
    };

    const handleSubmit = () => {
        if (selectedOption !== null && !submittedIndices.has(currentIndex)) {
            setSubmittedIndices(prev => new Set(prev).add(currentIndex));
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setSelectedOption(null);
        }
    };

    const handleNext = () => {
        if (currentIndex < displayedQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
        }
    };

    const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJumpToInput(e.target.value);
    };

    const handleJumpTo = () => {
        const targetIndex = parseInt(jumpToInput, 10) - 1;
        if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < displayedQuestions.length) {
            setCurrentIndex(targetIndex);
            setSelectedOption(null);
        } else {
            console.warn(`Invalid jump target: ${jumpToInput}`);
            alert(`Invalid question number. Please enter a number between 1 and ${displayedQuestions.length}.`);
            setJumpToInput('');
        }
    };

    const currentQuestion = displayedQuestions.length > 0 ? displayedQuestions[currentIndex] : null;
    const isCurrentSubmitted = submittedIndices.has(currentIndex);
    const totalFilteredQuestions = displayedQuestions.length;

    // --- Render Logic ---
    return (
        <>
            {/* ─── Google Fonts import ─── */}
            <style>{`
                /* ── Title ── */
                .page-title {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(1.7rem, 5vw, 2.6rem);
                    font-weight: 900;
                    color: var(--ink);
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                }
                .page-title span {
                    color: var(--saffron);
                }
                .page-subtitle {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 500;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: var(--ink-muted);
                    margin-bottom: 0.35rem;
                }

                /* ── Shared button base ── */
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

                /* Primary — saffron fill */
                .btn-primary {
                    background: var(--saffron);
                    color: #fff;
                    border-color: var(--saffron);
                    box-shadow: 0 2px 8px rgba(26,86,160,0.22);
                }
                .btn-primary:hover {
                    background: var(--blue-hover);
                    border-color: var(--blue-hover);
                    box-shadow: 0 4px 14px rgba(26,86,160,0.32);
                }

                /* Secondary — outlined ink */
                .btn-secondary {
                    background: transparent;
                    color: var(--ink);
                    border-color: var(--border);
                }
                .btn-secondary:hover {
                    background: var(--paper-alt);
                    border-color: var(--ink-muted);
                }

                /* Ghost green — Android download */
                .btn-ghost-green {
                    background: var(--green-lt);
                    color: var(--green);
                    border-color: var(--border-green-soft);
                }
                .btn-ghost-green:hover {
                    background: #D6EFE3;
                    border-color: var(--green);
                }

                /* Nav arrows */
                .btn-nav {
                    background: var(--paper-alt);
                    color: var(--ink);
                    border-color: var(--border);
                    font-size: 0.88rem;
                    padding: 0.5rem 1.3rem;
                }
                .btn-nav:hover:not(:disabled) {
                    background: var(--saffron-lt);
                    border-color: var(--saffron);
                    color: var(--saffron);
                }
                .btn-nav:disabled {
                    opacity: 0.38;
                    cursor: not-allowed;
                }

                /* Submit */
                .btn-submit {
                    background: var(--blue);
                    color: #fff;
                    border-color: var(--blue);
                    padding: 0.5rem 1.6rem;
                    box-shadow: 0 2px 8px rgba(26,86,160,0.2);
                }
                .btn-submit:hover:not(:disabled) {
                    background: var(--blue-hover);
                    border-color: var(--blue-hover);
                }
                .btn-submit:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .btn-submit-done {
                    background: var(--paper-alt);
                    color: var(--ink-muted);
                    border-color: var(--border);
                    cursor: not-allowed;
                    opacity: 0.75;
                }

                /* Small utility */
                .btn-sm {
                    font-size: 0.76rem;
                    padding: 0.35rem 0.8rem;
                }

                /* ── Card / surface ── */
                .card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
                }

                /* ── Divider rule under title ── */
                .title-rule {
                    width: 3rem;
                    height: 3px;
                    background: var(--saffron);
                    border-radius: 2px;
                    margin-top: 0.6rem;
                }
            `}</style>

            <div
                className="container mx-auto px-3 sm:px-5 py-3 sm:py-5"
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
                }}
            >
                {/* ── Header ── */}
                <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="page-subtitle">Civil Services Examination</p>
                        <h1 className="page-title">
                            UPSC&nbsp;<span>PYQs</span>&nbsp;Practice
                        </h1>
                        <div className="title-rule" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="https://play.google.com/store/apps/details?id=com.upscpyqs.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost-green"
                        >
                            {/* Android icon */}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34a1 1 0 0 1-1 1H7.477a1 1 0 0 1-1-1V8.66a1 1 0 0 1 1-1h9.046a1 1 0 0 1 1 1v6.68zM14.86 2.19l1.09-1.89a.25.25 0 0 0-.43-.25l-1.1 1.91A6.94 6.94 0 0 0 12 1.6c-.85 0-1.67.13-2.44.36L8.46.05a.25.25 0 0 0-.43.25L9.1 2.19A7.01 7.01 0 0 0 5 8.5h14a7.01 7.01 0 0 0-4.14-6.31zM9.5 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/></svg>
                            Android App
                        </a>
                        <Link to="/about" className="btn btn-secondary">
                            About Me
                        </Link>
                        <Link to="/quiz" className="btn btn-primary">
                            {/* Quiz icon */}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Take Quiz
                        </Link>
                    </div>
                </div>

                {/* Filter Section - Collapsible */}
                <div className="card mb-4 sm:mb-6">
                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="w-full p-3 sm:p-4 flex justify-between items-center text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Select Filters
                        </span>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>
                            {isFiltersOpen ? '▼' : '▶'}
                        </span>
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-3 sm:p-4" style={{ borderTop: '1px solid var(--border)' }}>
                            {isLoadingCsv && <p className="text-center" style={{ color: 'var(--blue)' }}>Loading question data…</p>}
                            {!isLoadingCsv && csvError && (
                                <p className="text-center p-2 rounded" style={{ color: 'var(--red)', background: 'var(--red-lt)', border: '1px solid var(--border-red-tint)' }}>
                                    Error: {csvError}
                                </p>
                            )}
                            {!isLoadingCsv && !csvError && allQuestions.length === 0 && (
                                <p className="text-center" style={{ color: 'var(--ink-muted)' }}>No question data found. Please check the `upscpyqs.csv` file.</p>
                            )}
                            {!isLoadingCsv && !csvError && allQuestions.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Paper — single select (top-level grouping) */}
                                    <div>
                                        <label htmlFor="paper" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.3rem' }}>
                                            Paper
                                        </label>
                                        <select
                                            id="paper"
                                            name="paper"
                                            value={filters.paper}
                                            onChange={handleFilterChange}
                                            style={{
                                                width: '100%',
                                                padding: '0.45rem 0.7rem',
                                                fontSize: '0.85rem',
                                                border: '1.5px solid var(--border)',
                                                borderRadius: '6px',
                                                background: 'var(--surface)',
                                                color: 'var(--ink)',
                                                fontFamily: "'DM Sans', sans-serif",
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">All Papers</option>
                                            {availablePapers.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <MultiSelect
                                        label="Subject"
                                        selected={filters.subjects}
                                        onChange={handleSubjectsChange}
                                        options={availableSubjects}
                                        placeholder={filters.paper ? 'All Subjects for Paper' : 'All Subjects'}
                                        disabled={availableSubjects.length === 0}
                                    />
                                    <MultiSelect
                                        label="Topic"
                                        selected={filters.topics}
                                        onChange={handleTopicsChange}
                                        options={topicGroups ? undefined : availableTopics}
                                        groups={topicGroups ?? undefined}
                                        placeholder={filters.subjects.length > 0 ? 'All Topics for Subject' : 'All Topics'}
                                        disabled={availableTopics.length === 0}
                                    />
                                    <MultiSelect
                                        label="Year"
                                        selected={filters.years}
                                        onChange={handleYearsChange}
                                        options={availableYears}
                                        placeholder="All Years"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search and Random Section */}
                <div
                    className={`card mb-4 sm:mb-6 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 ${isLoadingCsv || csvError ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <div className="w-full sm:w-1/2 lg:w-2/3" style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </span>
                        <input
                            type="text"
                            id="search"
                            placeholder="Search questions, options, explanations…"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            disabled={isLoadingCsv || !!csvError || allQuestions.length === 0}
                            style={{
                                width: '100%',
                                padding: '0.48rem 0.75rem 0.48rem 2.1rem',
                                fontSize: '0.85rem',
                                border: '1.5px solid var(--border)',
                                borderRadius: '6px',
                                fontFamily: "'DM Sans', sans-serif",
                                color: 'var(--ink)',
                                background: 'var(--surface)',
                            }}
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            id="random"
                            checked={isRandom}
                            onChange={handleRandomToggle}
                            disabled={isLoadingCsv || !!csvError || allQuestions.length === 0}
                            style={{ accentColor: 'var(--saffron)', width: '1rem', height: '1rem' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Random Order</span>
                    </label>
                </div>

                {/* No Matching Questions Message */}
                {!isLoadingCsv && !csvError && allQuestions.length > 0 && displayedQuestions.length === 0 && (
                    <p className="text-center my-8" style={{ color: 'var(--ink-muted)' }}>No questions found matching your criteria.</p>
                )}

                {/* Single Question Display Area */}
                {!isLoadingCsv && !csvError && currentQuestion && (
                    <div className="card my-4 sm:my-6 p-3 sm:p-6">
                        {/* Jump To Section */}
                        <div className="mb-3 flex flex-wrap items-center justify-end gap-2" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                            <label htmlFor="jumpTo">Go to:</label>
                            <input
                                type="number"
                                id="jumpTo"
                                min="1"
                                max={totalFilteredQuestions}
                                value={jumpToInput}
                                onChange={handleJumpInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleJumpTo()}
                                disabled={totalFilteredQuestions <= 1}
                                style={{
                                    width: '3.5rem',
                                    padding: '0.28rem 0.4rem',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '5px',
                                    textAlign: 'center',
                                    fontSize: '0.8rem',
                                    fontFamily: "'DM Sans', sans-serif",
                                    background: 'var(--surface)',
                                    color: 'var(--ink)',
                                }}
                            />
                            <button
                                onClick={handleJumpTo}
                                disabled={totalFilteredQuestions <= 1 || !jumpToInput}
                                className="btn btn-secondary btn-sm"
                            >
                                Go
                            </button>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <label htmlFor="id">ID:</label>
                            <input
                                type="number"
                                id="id"
                                name="id"
                                value={filters.id}
                                onChange={handleFilterChange}
                                placeholder="—"
                                style={{
                                    width: '3.5rem',
                                    padding: '0.28rem 0.4rem',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '5px',
                                    textAlign: 'center',
                                    fontSize: '0.8rem',
                                    fontFamily: "'DM Sans', sans-serif",
                                    background: 'var(--surface)',
                                    color: 'var(--ink)',
                                }}
                            />
                        </div>

                        {/* Question Header */}
                        <div className="mb-3 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
                                Question {currentIndex + 1}
                                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--ink-muted)', marginLeft: '0.5rem' }}>of {totalFilteredQuestions}</span>
                            </h2>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', background: 'var(--paper-alt)', padding: '0.18rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                ID {currentQuestion.id} &nbsp;·&nbsp; {currentQuestion.paper ?? 'N/A'} {currentQuestion.year && `· ${currentQuestion.year}`}
                            </span>
                        </div>

                        {/* Passage */}
                        {currentQuestion.passage && (
                            <div className="mb-3 p-3 rounded" style={{ background: 'var(--paper-alt)', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--ink)' }}>
                                <p style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--saffron)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Passage</p>
                                <p className="whitespace-pre-line">{formatText(currentQuestion.passage)}</p>
                            </div>
                        )}

                        {/* Image */}
                        {currentQuestion.image_url && (
                            <div className="mb-3 text-center">
                                <img
                                    src={`/${currentQuestion.image_url}`}
                                    alt="Question related image"
                                    className="max-w-full h-auto inline-block rounded"
                                    style={{ border: '1px solid var(--border)' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.style.display = 'none';
                                        const errorMsg = document.createElement('p');
                                        errorMsg.textContent = 'Image failed to load.';
                                        errorMsg.className = 'text-red-500 text-xs italic';
                                        target.parentNode?.insertBefore(errorMsg, target.nextSibling);
                                    }}
                                />
                            </div>
                        )}

                        {/* Question Text */}
                        <p className="mb-4 whitespace-pre-line" style={{ fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                            {formatText(currentQuestion.question) ?? 'Question text missing'}
                        </p>

                        {/* Options */}
                        <div className="space-y-2 mb-5">
                            {(['A', 'B', 'C', 'D'] as const).map(optLetter => {
                                const optionKey = `option_${optLetter.toLowerCase()}` as keyof Question;
                                const optionText = currentQuestion[optionKey] != null ? formatText(String(currentQuestion[optionKey])) : `Option ${optLetter} missing`;
                                const isSelected = selectedOption === optLetter;
                                const isCorrect = currentQuestion.correct_option?.toUpperCase() === optLetter;

                                let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--ink)', cursor = 'pointer';
                                if (isCurrentSubmitted) {
                                    cursor = 'not-allowed';
                                    if (isCorrect) { bg = 'var(--green-lt)'; border = 'var(--border-green-strong)'; color = 'var(--green)'; }
                                    else if (isSelected) { bg = 'var(--red-lt)'; border = 'var(--border-red-tint)'; color = 'var(--red)'; }
                                    else { bg = 'var(--paper-alt)'; color = 'var(--ink-muted)'; }
                                } else if (isSelected) {
                                    bg = 'var(--saffron-lt)'; border = 'var(--saffron)'; color = 'var(--saffron)';
                                }

                                return (
                                    <div
                                        key={optLetter}
                                        onClick={() => handleOptionSelect(optLetter)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.6rem',
                                            padding: '0.6rem 0.85rem',
                                            borderRadius: '7px',
                                            border: `1.5px solid ${border}`,
                                            background: bg,
                                            color,
                                            cursor,
                                            transition: 'background 0.15s, border-color 0.15s',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, minWidth: '1.2rem' }}>{optLetter})</span>
                                        <span className="whitespace-pre-line flex-1">{optionText}</span>
                                        {isCurrentSubmitted && isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--green)' }}>✓</span>}
                                        {isCurrentSubmitted && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--red)' }}>✗</span>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isCurrentSubmitted && (
                            currentQuestion.explanation ? (
                                <div className="mt-3 p-3 rounded" style={{ background: 'var(--blue-lt)', border: '1px solid var(--border-blue-tint)' }}>
                                    <p style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: '0.4rem', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explanation</p>
                                    <p className="whitespace-pre-line" style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>{formatText(currentQuestion.explanation)}</p>
                                </div>
                            ) : (
                                <p className="mt-3" style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>No explanation available.</p>
                            )
                        )}

                        {/* Navigation */}
                        <div className="mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                            <button onClick={handlePrevious} disabled={currentIndex === 0} className="btn btn-nav w-full sm:w-auto">
                                ← Previous
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={selectedOption === null || isCurrentSubmitted}
                                className={`btn w-full sm:w-auto ${isCurrentSubmitted ? 'btn-submit-done' : 'btn-submit'}`}
                            >
                                {isCurrentSubmitted ? '✓ Submitted' : 'Submit Answer'}
                            </button>
                            <button onClick={handleNext} disabled={currentIndex === totalFilteredQuestions - 1} className="btn btn-nav w-full sm:w-auto">
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Section */}
                <div className="mt-8" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setIsFooterOpen(!isFooterOpen)}
                        className="w-full p-4 flex justify-between items-center text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>About &amp; Contact</span>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '0.72rem' }}>{isFooterOpen ? '▼' : '▶'}</span>
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${isFooterOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-4" style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                            <p className="mb-3 max-w-2xl" style={{ lineHeight: 1.65 }}>
                                <strong style={{ color: 'var(--ink)' }}>Disclaimer:</strong> This app is not affiliated with, associated with, endorsed by, or in any way officially connected with the Union Public Service Commission (UPSC).
                                <br /><br />
                                <strong style={{ color: 'var(--ink)' }}>Source:</strong> Questions are sourced from the official UPSC website: <a href="https://upsc.gov.in/examinations/previous-question-papers" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--saffron)' }}>upsc.gov.in</a>
                                <br /><br />
                                Explanations are contributed by users for educational purposes. If you believe any content infringes copyright, please contact us.
                            </p>
                            <div className="mb-3 space-y-1">
                                <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>Contact us</p>
                                <p>Email: upscpreviousquestions@gmail.com</p>
                                <p>
                                    Telegram:{' '}
                                    <a href="https://t.me/+b-yWUaj2okhmN2Q1" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--saffron)' }}>
                                        UPSC Prelims PYQS
                                    </a>
                                </p>
                                <p>UPI: alamanikanta1110@oksbi</p>
                            </div>
                            <p>
                                Want to contribute?{' '}
                                <a href="https://github.com/mous9270/upsc" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--saffron)' }}>
                                    GitHub ↗
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Pyqs;