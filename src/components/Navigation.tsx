import React, { useState } from 'react';

const Navigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
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
            <a href="/about" className="hover:text-gray-900">
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
  );
};

export default Navigation;

