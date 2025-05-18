import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Import PapaParse from the installed npm package
import Papa from 'papaparse';

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

// Interface for filters remains the same
interface Filters {
    paper: string;
    subject: string;
    topic: string;
    year: string;
    id: string; // Add ID to filters
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
    const [filters, setFilters] = useState<Filters>({ paper: '', subject: '', topic: '', year: '', id: '' });
    const [availablePapers, setAvailablePapers] = useState<string[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
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

     // --- Derive Filter Options from Loaded Data ---
     useEffect(() => {
        if (isLoadingCsv || csvError) {
             setAvailablePapers([]);
             setAvailableSubjects([]);
             setAvailableTopics([]);
             setAvailableYears([]);
             return;
        }
        if (allQuestions.length === 0) {
            setAvailablePapers([]);
            setAvailableSubjects([]);
            setAvailableTopics([]);
            setAvailableYears([]);
            return;
        }

        // Derive unique, sorted options - ensure filtering out null/undefined values
        const papers = Array.from(new Set(allQuestions.map(q => q.paper).filter((p): p is string => !!p))).sort();
        const years = Array.from(new Set(allQuestions.map(q => q.year).filter((y): y is string => !!y)))
                      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

        setAvailablePapers(papers);
        setAvailableYears(years);
        setIsLoadingCsv(false); // Mark loading complete

    }, [allQuestions, isLoadingCsv, csvError]);

    // --- Derive Available Subjects based on Selected Paper ---
    useEffect(() => {
        if (isLoadingCsv || csvError || allQuestions.length === 0) {
            setAvailableSubjects([]);
            return;
        }
        let subjectsToShow: string[];
        if (!filters.paper) {
             subjectsToShow = Array.from(new Set(allQuestions.map(q => q.subject).filter((s): s is string => !!s))).sort();
        } else {
            subjectsToShow = Array.from(new Set(
                allQuestions
                    .filter(q => q.paper === filters.paper)
                    .map(q => q.subject)
                    .filter((s): s is string => !!s)
            )).sort();
        }
        setAvailableSubjects(subjectsToShow);
    }, [filters.paper, allQuestions, isLoadingCsv, csvError]);

    // --- Derive Available Topics based on Selected Paper and Subject ---
    useEffect(() => {
         if (isLoadingCsv || csvError || allQuestions.length === 0) {
            setAvailableTopics([]);
            return;
        }
        let topicsToShow: string[];
        const paperFilteredQuestions = filters.paper ? allQuestions.filter(q => q.paper === filters.paper) : allQuestions;
        if (!filters.subject) {
             topicsToShow = Array.from(new Set(paperFilteredQuestions.map(q => q.topic).filter((t): t is string => !!t))).sort();
        } else {
            topicsToShow = Array.from(new Set(
                paperFilteredQuestions
                    .filter(q => q.subject === filters.subject)
                    .map(q => q.topic)
                    .filter((t): t is string => !!t)
            )).sort();
        }
         setAvailableTopics(topicsToShow);
    }, [filters.paper, filters.subject, allQuestions, isLoadingCsv, csvError]);


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

        // Apply filters (ensure properties exist before filtering)
        if (filters.paper) {
            filtered = filtered.filter(q => q.paper === filters.paper);
        }
        if (filters.subject) {
            filtered = filtered.filter(q => q.subject === filters.subject);
        }
        if (filters.topic) {
            filtered = filtered.filter(q => q.topic === filters.topic);
        }
        if (filters.year) {
            filtered = filtered.filter(q => q.year === filters.year);
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
        setFilters(prevFilters => {
            const newFilters = { ...prevFilters, [name]: value };
            if (name === 'paper') {
                newFilters.subject = '';
                newFilters.topic = '';
            } else if (name === 'subject') {
                newFilters.topic = '';
            }
            return newFilters;
        });
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

    // --- Memoized Render Helpers ---
    const renderSelectOptions = useMemo(() => (options: string[], defaultLabel: string) => (
        <>
            <option value="">{defaultLabel}</option>
            {options && options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </>
    ), []);

    const currentQuestion = displayedQuestions.length > 0 ? displayedQuestions[currentIndex] : null;
    const isCurrentSubmitted = submittedIndices.has(currentIndex);
    const totalFilteredQuestions = displayedQuestions.length;

    // --- Render Logic ---
    return (
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 font-sans">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">UPSC PYQs Practice</h1>

            {/* Quiz Button */}
            <div className="mb-4 sm:mb-6 flex justify-end">
                <a
                    href="/quiz"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Take Quiz
                </a>
            </div>

            {/* Filter Section - Now Collapsible */}
            <div className="mb-4 sm:mb-8 border rounded-lg shadow-md bg-white">
                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="w-full p-3 sm:p-4 flex justify-between items-center text-left"
                >
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Select Filters</h2>
                    <span className="text-gray-500">
                        {isFiltersOpen ? '▼' : '▶'}
                    </span>
                </button>

                <div className={`transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-3 sm:p-4 border-t">
                        {isLoadingCsv && <p className="text-center text-blue-600">Loading question data...</p>}
                        {!isLoadingCsv && csvError && <p className="text-center text-red-600 bg-red-100 p-2 sm:p-3 rounded border border-red-300">Error: {csvError}</p>}
                        {!isLoadingCsv && !csvError && allQuestions.length === 0 && (
                            <p className="text-center text-gray-500">No question data found. Please check the `upscpyqs.csv` file.</p>
                        )}
                        {!isLoadingCsv && !csvError && allQuestions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {/* Paper */}
                                <div>
                                    <label htmlFor="paper" className="block text-sm font-medium text-gray-600 mb-1">Paper</label>
                                    <select id="paper" name="paper" value={filters.paper} onChange={handleFilterChange} 
                                        className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm">
                                        {renderSelectOptions(availablePapers, 'All Papers')}
                                    </select>
                                </div>
                                {/* Subject */}
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
                                    <select
                                        id="subject" name="subject" value={filters.subject} onChange={handleFilterChange}
                                        disabled={availableSubjects.length === 0}
                                        className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                                    >
                                        {renderSelectOptions(availableSubjects, filters.paper ? 'All Subjects for Paper' : 'All Subjects')}
                                    </select>
                                </div>
                                {/* Topic */}
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-600 mb-1">Topic</label>
                                    <select
                                        id="topic" name="topic" value={filters.topic} onChange={handleFilterChange}
                                        disabled={availableTopics.length === 0}
                                        className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                                    >
                                        {renderSelectOptions(availableTopics, filters.subject ? 'All Topics for Subject' : 'All Topics')}
                                    </select>
                                </div>
                                {/* Year */}
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                                    <select id="year" name="year" value={filters.year} onChange={handleFilterChange} 
                                        className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm">
                                        {renderSelectOptions(availableYears, 'All Years')}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search and Random Section */}
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg shadow-md bg-white flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 ${isLoadingCsv || csvError ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-full sm:w-1/2 lg:w-2/3">
                    <label htmlFor="search" className="sr-only">Search Questions</label>
                    <input
                        type="text" id="search" placeholder="Search..." value={searchTerm} onChange={handleSearchChange}
                        className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm"
                        disabled={isLoadingCsv || !!csvError || allQuestions.length === 0}
                    />
                </div>
                <div className="flex items-center w-full sm:w-auto">
                    <input
                        type="checkbox" id="random" checked={isRandom} onChange={handleRandomToggle}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                        disabled={isLoadingCsv || !!csvError || allQuestions.length === 0}
                    />
                    <label htmlFor="random" className="text-sm sm:text-base font-medium text-gray-700">Random Order</label>
                </div>
            </div>

            {/* No Matching Questions Message */}
            {!isLoadingCsv && !csvError && allQuestions.length > 0 && displayedQuestions.length === 0 && (
                <p className="text-center text-base sm:text-lg text-gray-500 my-6 sm:my-8">No questions found matching your criteria.</p>
            )}

            {/* Single Question Display Area */}
            {!isLoadingCsv && !csvError && currentQuestion && (
                <div className="my-4 sm:my-8 p-3 sm:p-6 border rounded-lg shadow-lg bg-white">
                    {/* Jump To Section */}
                    <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-end gap-2 text-xs sm:text-sm">
                        <label htmlFor="jumpTo">Go to:</label>
                        <input
                            type="number" id="jumpTo" min="1" max={totalFilteredQuestions} value={jumpToInput}
                            onChange={handleJumpInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleJumpTo()}
                            className="w-14 sm:w-16 p-1 border border-gray-300 rounded-md text-center"
                            disabled={totalFilteredQuestions <= 1}
                        />
                        <button
                            onClick={handleJumpTo}
                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={totalFilteredQuestions <= 1 || !jumpToInput}
                        > Go </button>
                        <span className="mx-1 sm:mx-2">|</span>
                        <label htmlFor="id">Search ID:</label>
                        <input
                            type="number"
                            id="id"
                            name="id"
                            value={filters.id}
                            onChange={handleFilterChange}
                            placeholder="ID"
                            className="w-14 sm:w-16 p-1 border border-gray-300 rounded-md text-center"
                        />
                    </div>

                    {/* Question Header */}
                    <div className="mb-3 sm:mb-4 pb-2 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                            Question {currentIndex + 1} of {totalFilteredQuestions}
                        </h2>
                        <span className="text-xs text-gray-500">
                            ID: {currentQuestion.id} | {currentQuestion.paper ?? 'N/A'} {currentQuestion.year && `(${currentQuestion.year})`}
                        </span>
                    </div>

                    {/* Passage */}
                    {currentQuestion.passage && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded text-xs sm:text-sm text-gray-700">
                            <p className="font-semibold mb-1">Passage:</p>
                            <p className="whitespace-pre-line">{formatText(currentQuestion.passage)}</p>
                        </div>
                    )}

                    {/* Image (Optional Display) */}
                    {currentQuestion.image_url && (
                        <div className="mb-3 sm:mb-4 text-center">
                            <img
                                src={`/${currentQuestion.image_url}`}
                                alt="Question related image"
                                className="max-w-full h-auto inline-block rounded border border-gray-200"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.style.display = 'none';
                                    const errorMsg = document.createElement('p');
                                    errorMsg.textContent = 'Image failed to load.';
                                    errorMsg.className = 'text-red-500 text-xs sm:text-sm italic';
                                    target.parentNode?.insertBefore(errorMsg, target.nextSibling);
                                }}
                            />
                        </div>
                    )}

                    {/* Question Text */}
                    <p className="mb-4 sm:mb-5 text-base sm:text-lg text-gray-900 whitespace-pre-line">{formatText(currentQuestion.question) ?? 'Question text missing'}</p>

                    {/* Options */}
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {(['A', 'B', 'C', 'D'] as const).map(optLetter => {
                            const optionKey = `option_${optLetter.toLowerCase()}` as keyof Question;
                            const optionText = currentQuestion[optionKey] != null ? formatText(String(currentQuestion[optionKey])) : `Option ${optLetter} missing`;
                            const isSelected = selectedOption === optLetter;
                            const isCorrect = currentQuestion.correct_option?.toUpperCase() === optLetter;

                            let optionClasses = "p-2 sm:p-3 rounded border transition-colors flex items-start text-sm sm:text-base";
                            if (isCurrentSubmitted) {
                                optionClasses += " cursor-not-allowed";
                                if (isCorrect) optionClasses += " bg-green-100 border-green-400 text-green-800";
                                else if (isSelected) optionClasses += " bg-red-100 border-red-400 text-red-800";
                                else optionClasses += " bg-gray-50 border-gray-200 opacity-75 text-gray-700";
                            } else {
                                optionClasses += " cursor-pointer";
                                optionClasses += isSelected
                                    ? " bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300 text-indigo-900"
                                    : " bg-white border-gray-300 hover:bg-gray-50 text-gray-800";
                            }

                            return (
                                <div key={optLetter} className={optionClasses} onClick={() => handleOptionSelect(optLetter)}>
                                    <span className="font-bold mr-2 sm:mr-3">{optLetter})</span>
                                    <span className="whitespace-pre-line flex-1">{optionText}</span>
                                    {isCurrentSubmitted && isCorrect && <span className="ml-auto pl-2 font-bold text-green-600">✓</span>}
                                    {isCurrentSubmitted && isSelected && !isCorrect && <span className="ml-auto pl-2 font-bold text-red-600">✗</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {isCurrentSubmitted && (
                        currentQuestion.explanation ? (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded">
                                <h3 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Explanation:</h3>
                                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{formatText(currentQuestion.explanation)}</p>
                            </div>
                        ) : (
                            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 italic">No explanation available.</p>
                        )
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                        <button
                            onClick={handlePrevious} disabled={currentIndex === 0}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        > &larr; Previous </button>
                        <button
                            onClick={handleSubmit} disabled={selectedOption === null || isCurrentSubmitted}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-indigo-400"
                        > {isCurrentSubmitted ? 'Answer Submitted' : 'Submit Answer'} </button>
                        <button
                            onClick={handleNext} disabled={currentIndex === totalFilteredQuestions - 1}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        > Next &rarr; </button>
                    </div>
                </div>
            )}

            {/* Footer Section */}
            <div className="mt-8 border-t border-gray-200">
                <button
                    onClick={() => setIsFooterOpen(!isFooterOpen)}
                    className="w-full p-4 flex justify-between items-center text-left text-sm text-gray-600 hover:bg-gray-50"
                >
                    <span className="font-medium">About & Contact</span>
                    <span className="text-gray-500">
                        {isFooterOpen ? '▼' : '▶'}
                    </span>
                </button>

                <div className={`transition-all duration-300 ease-in-out ${isFooterOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-4 text-sm text-gray-500">
                        <p className="mb-3 max-w-2xl">
                        Note: Current explanations have been removed as they were taken from random sources without carefully considering copyright. As the community is growing, I want to be more careful. With the help of others, I will work to provide more authentic explanations and make the website better. If you'd like to check the GitHub link, it's provided below — contributions are welcome. Explanations on this platform are contributed by users for educational purposes. If you believe any content infringes copyright, please contact us and we will remove it promptly.


                        </p>
                        <div className="mb-3 space-y-1">
                            <p className="text-gray-600 font-medium">Contact us:</p>
                            <p>Email: srinivas@upscpreviousquestiones.com</p>
                            <p>
                                Telegram:{' '}
                                <a 
                                    href="https://t.me/+b-yWUaj2okhmN2Q1" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                    UPSC Prelims PYQS
                                </a>
                            </p>
                            <p>Support: alamanikanta1110@oksbi</p>
                        </div>
                        <p className="text-gray-600">
                            Want to contribute? Help improve this platform by contributing on{' '}
                            <a 
                                href="https://github.com/mous9270/upsc" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                                GitHub
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pyqs;
