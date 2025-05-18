import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

interface QuizQuestion {
    id: number;
    paper: string | null;
    passage: string | null;
    question: string | null;
    option_a: string | null;
    option_b: string | null;
    option_c: string | null;
    option_d: string | null;
    correct_option: string | null;
    explanation: string | null;
    subject: string | null;
    topic: string | null;
    year: string | null;
}

interface QuizState {
    questions: QuizQuestion[];
    currentIndex: number;
    selectedAnswers: { [key: number]: string };
    submitted: boolean;
    score: number;
}

const Quiz: React.FC = () => {
    const [quizState, setQuizState] = useState<QuizState>({
        questions: [],
        currentIndex: 0,
        selectedAnswers: {},
        submitted: false,
        score: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                try {
                    const questions = results.data.map((row: any, index: number) => ({
                        id: index + 1,
                        paper: row.Paper || null,
                        passage: row.Passage || null,
                        question: row.Question || null,
                        option_a: row['Option A'] || null,
                        option_b: row['Option B'] || null,
                        option_c: row['Option C'] || null,
                        option_d: row['Option D'] || null,
                        correct_option: row['Correct Answer'] || null,
                        explanation: row.Explanation || null,
                        subject: row.Subject || null,
                        topic: row.Topic || null,
                        year: row.Year || null,
                    }));

                    setQuizState({
                        questions,
                        currentIndex: 0,
                        selectedAnswers: {},
                        submitted: false,
                        score: 0
                    });
                } catch (err) {
                    setError('Error processing CSV file. Please check the format.');
                }
                setIsLoading(false);
            },
            error: (error) => {
                setError('Error reading CSV file: ' + error.message);
                setIsLoading(false);
            }
        });
    };

    const handleAnswerSelect = (option: string) => {
        if (quizState.submitted) return;

        setQuizState(prev => ({
            ...prev,
            selectedAnswers: {
                ...prev.selectedAnswers,
                [quizState.currentIndex]: option
            }
        }));
    };

    const handleSubmit = () => {
        let score = 0;
        quizState.questions.forEach((question, index) => {
            if (question.correct_option?.toUpperCase() === quizState.selectedAnswers[index]?.toUpperCase()) {
                score++;
            }
        });

        setQuizState(prev => ({
            ...prev,
            submitted: true,
            score
        }));
    };

    const handleSaveQuiz = () => {
        const quizData = {
            questions: quizState.questions,
            answers: quizState.selectedAnswers,
            score: quizState.score,
            totalQuestions: quizState.questions.length,
            date: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const currentQuestion = quizState.questions[quizState.currentIndex];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">UPSC Quiz</h1>

            {!quizState.questions.length && (
                <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Upload Quiz CSV</h2>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="w-full p-2 border border-gray-300 rounded"
                        disabled={isLoading}
                    />
                    {isLoading && <p className="mt-2 text-blue-600">Loading quiz...</p>}
                    {error && <p className="mt-2 text-red-600">{error}</p>}
                </div>
            )}

            {quizState.questions.length > 0 && !quizState.submitted && (
                <div className="max-w-3xl mx-auto">
                    <div className="mb-4 flex justify-between items-center">
                        <span className="text-gray-600">
                            Question {quizState.currentIndex + 1} of {quizState.questions.length}
                        </span>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Submit Quiz
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        {currentQuestion.passage && (
                            <div className="mb-4 p-4 bg-gray-50 rounded">
                                <p className="font-semibold mb-2">Passage:</p>
                                <p className="whitespace-pre-line">{currentQuestion.passage}</p>
                            </div>
                        )}

                        <p className="text-lg mb-4">{currentQuestion.question}</p>

                        <div className="space-y-3">
                            {['A', 'B', 'C', 'D'].map((option) => {
                                const optionKey = `option_${option.toLowerCase()}` as keyof QuizQuestion;
                                const isSelected = quizState.selectedAnswers[quizState.currentIndex] === option;
                                
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswerSelect(option)}
                                        className={`w-full p-3 text-left rounded border transition-colors ${
                                            isSelected
                                                ? 'bg-indigo-100 border-indigo-400'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="font-bold mr-2">{option})</span>
                                        {currentQuestion[optionKey]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {quizState.submitted && (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                        <p className="text-lg mb-4">
                            Score: {quizState.score} out of {quizState.questions.length}
                            ({((quizState.score / quizState.questions.length) * 100).toFixed(1)}%)
                        </p>
                        <button
                            onClick={handleSaveQuiz}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save Quiz Results
                        </button>
                    </div>

                    {quizState.questions.map((question, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="mb-4">
                                <span className="text-gray-600">Question {index + 1}</span>
                                {question.passage && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded">
                                        <p className="font-semibold mb-2">Passage:</p>
                                        <p className="whitespace-pre-line">{question.passage}</p>
                                    </div>
                                )}
                                <p className="mt-2 text-lg">{question.question}</p>
                            </div>

                            <div className="space-y-2">
                                {['A', 'B', 'C', 'D'].map((option) => {
                                    const optionKey = `option_${option.toLowerCase()}` as keyof QuizQuestion;
                                    const isSelected = quizState.selectedAnswers[index] === option;
                                    const isCorrect = question.correct_option?.toUpperCase() === option;

                                    return (
                                        <div
                                            key={option}
                                            className={`p-3 rounded border ${
                                                isCorrect
                                                    ? 'bg-green-100 border-green-400'
                                                    : isSelected
                                                    ? 'bg-red-100 border-red-400'
                                                    : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            <span className="font-bold mr-2">{option})</span>
                                            {question[optionKey]}
                                            {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                                            {isSelected && !isCorrect && <span className="ml-2 text-red-600">✗</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {question.explanation && (
                                <div className="mt-4 p-4 bg-blue-50 rounded">
                                    <p className="font-semibold text-blue-800 mb-2">Explanation:</p>
                                    <p className="text-gray-700">{question.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Quiz; 