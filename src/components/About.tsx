import React, { useState } from 'react';

const About: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Back to home */}
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span className="mr-1 text-lg" aria-hidden="true">
                ←
              </span>
              <span>Back to Home</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-700">
              <a href="/" className="hover:text-gray-900">
                Home
              </a>
              <a href="/quiz" className="hover:text-gray-900">
                Quiz
              </a>
              <a href="/about" className="font-medium text-gray-900">
                About
              </a>
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open navigation</span>
              <div className="space-y-1">
                <span className="block h-0.5 w-5 bg-gray-700" />
                <span className="block h-0.5 w-5 bg-gray-700" />
                <span className="block h-0.5 w-5 bg-gray-700" />
              </div>
            </button>
          </div>

          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-2">
              <div className="max-w-4xl mx-auto bg-white border rounded-lg shadow-sm divide-y">
                <a
                  href="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </a>
                <a
                  href="/about"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </a>
                <a
                  href="/quiz"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Quiz
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-14">
          {/* 1. Hero / Intro Section */}
          <section className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-6 sm:space-y-0">
              <div className="flex justify-center sm:block">
                <img
                  src="/mani.png"
                  alt="Manikanta Srinivas"
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-md object-cover"
                />
              </div>
              <div className="text-gray-800">
                <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
                  Manikanta Srinivas
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  IIT Madras Graduate (Class of 2024) • Freelance Web Developer • Hyderabad
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Hi, I'm Manikanta Srinivas. I build tools and web applications that make
                  information easier to access and use.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  This platform was created to help UPSC aspirants explore and practice
                  Previous Year Questions (PYQs) in a structured and topic-wise format.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Why I Built This */}
          <section className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Why I Built This
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                While going through UPSC Previous Year Questions, I noticed that most of
                them are available only in PDF format, which makes them difficult to
                browse and practice efficiently.
              </p>
              <p>
                At the same time, many of my friends who are preparing for UPSC mentioned
                that they rarely find PYQs organized topic-wise, especially in the early
                stages of preparation.
              </p>
              <p>
                If questions are organized by topic, aspirants can review relevant PYQs
                immediately after finishing a topic, helping reinforce concepts and
                understand the exam pattern better.
              </p>
              <p>
                This platform was built to make UPSC PYQs easier to explore, filter, and
                practice.
              </p>
            </div>
          </section>

          {/* 3. Connect With Me */}
          <section className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Connect With Me
            </h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              If you&apos;d like to connect, collaborate, or just say hi, you can find me
              on the platforms below.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <a
                href="https://www.linkedin.com/in/manikanta-srinivas-ala"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center px-3 py-3 sm:py-4 border rounded-lg text-sm sm:text-base text-gray-800 bg-white hover:bg-gray-50 hover:shadow-md transition"
              >
                LinkedIn
              </a>
              <a
                href="https://x.com/srinivasala2732"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center px-3 py-3 sm:py-4 border rounded-lg text-sm sm:text-base text-gray-800 bg-white hover:bg-gray-50 hover:shadow-md transition"
              >
                X
              </a>
              <a
                href="https://t.me/srini1110"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center px-3 py-3 sm:py-4 border rounded-lg text-sm sm:text-base text-gray-800 bg-white hover:bg-gray-50 hover:shadow-md transition"
              >
                Telegram
              </a>
              <a
                href="https://www.youtube.com/watch?v=3JFKWGt6a6s&list=PLKaYCgwGWi7C-JepC9-gmCNBzcZYxAZEM&pp=0gcJCbQEOCosWNinsAgC"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center px-3 py-3 sm:py-4 border rounded-lg text-sm sm:text-base text-gray-800 bg-white hover:bg-gray-50 hover:shadow-md transition"
              >
                YouTube
              </a>
              <a
                href="https://github.com/mous9270/upsc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center px-3 py-3 sm:py-4 border rounded-lg text-sm sm:text-base text-gray-800 bg-white hover:bg-gray-50 hover:shadow-md transition"
              >
                GitHub
              </a>
            </div>
          </section>

          {/* 4. Suggestions / Feedback */}
          <section className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Suggestions Welcome
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed mb-6">
              <p>
                If you have any suggestions, ideas, or feedback that could make this
                platform better for UPSC aspirants, feel free to reach out to me.
              </p>
              <p>
                I would really appreciate hearing from users and improving the platform
                based on your feedback.
              </p>
            </div>
            <div>
              <a
                href="https://t.me/srini1110"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm sm:text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition"
              >
                Reach Out on Telegram
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;