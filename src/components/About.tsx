import React from 'react';
// import Navigation from './Navigation';

const About: React.FC = () => {
  return (
    <>
      {/* <Navigation /> */}

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

        .btn-secondary {
            background: transparent;
            color: var(--ink);
            border-color: var(--border);
        }
        .btn-secondary:hover {
            background: var(--paper-alt);
            border-color: var(--ink-muted);
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        .section-heading {
            font-family: 'Playfair Display', serif;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 1rem;
        }

        .body-text {
            font-family: 'DM Sans', sans-serif;
            font-size: 0.9rem;
            color: var(--ink-muted);
            line-height: 1.75;
        }

        /* Social link tiles */
        .social-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            padding: 1rem 0.75rem;
            border-radius: 8px;
            border: 1.5px solid var(--border);
            background: var(--surface);
            color: var(--ink);
            font-family: 'DM Sans', sans-serif;
            font-size: 0.82rem;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.18s, border-color 0.18s, color 0.18s, box-shadow 0.18s, transform 0.1s;
            cursor: pointer;
        }
        .social-tile:hover {
            background: var(--blue-lt);
            border-color: var(--blue);
            color: var(--blue);
            box-shadow: 0 2px 10px rgba(26,86,160,0.12);
            transform: translateY(-2px);
        }
        .social-tile svg {
            width: 1.3rem;
            height: 1.3rem;
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: 'var(--paper)', fontFamily: "'DM Sans', sans-serif" }}
      >
        <main className="container mx-auto px-3 sm:px-5 py-4 sm:py-6">
          <div style={{ maxWidth: '52rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Page header ── */}
            <div className="mb-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="page-subtitle">UPSC PYQs Practice</p>
                <h1 className="page-title">About <span>Me</span></h1>
                <div className="title-rule" />
              </div>
              <a href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.42rem 0.9rem' }}>
                ← Back to PYQs
              </a>
            </div>

            {/* ── 1. Hero / Intro ── */}
            <section className="card p-5 sm:p-7">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}
                   className="sm:flex-row sm:items-center">
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', width: '100%' }} className="sm:w-auto sm:block">
                  <img
                    src="/mani.png"
                    alt="Manikanta Srinivas"
                    style={{
                      width: '7.5rem',
                      height: '7.5rem',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--border)',
                      boxShadow: '0 4px 16px rgba(26,86,160,0.12)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>
                    Manikanta Srinivas
                  </h2>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.75rem' }}>
                    IIT Madras '24 &nbsp;·&nbsp; Freelance Web Developer &nbsp;·&nbsp; Hyderabad
                  </p>
                  <p className="body-text" style={{ marginBottom: '0.6rem' }}>
                    Hi, I'm Manikanta. I build tools and web applications that make information easier to access and use.
                  </p>
                  <p className="body-text">
                    This platform was created to help UPSC aspirants explore and practise Previous Year Questions in a structured, topic-wise format.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 2. Why I Built This ── */}
            <section className="card p-5 sm:p-7">
              <h2 className="section-heading">Why I Built This</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'While going through UPSC Previous Year Questions, I noticed that most of them are available only in PDF format, which makes them difficult to browse and practise efficiently.',
                  'Many friends preparing for UPSC mentioned that they rarely find PYQs organised topic-wise, especially in the early stages of preparation.',
                  'If questions are organised by topic, aspirants can review relevant PYQs immediately after finishing a topic — helping reinforce concepts and understand the exam pattern better.',
                  'This platform was built to make UPSC PYQs easier to explore, filter, and practise.',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: '0.35rem', width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
                    <p className="body-text" style={{ margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. Connect ── */}
            <section className="card p-5 sm:p-7">
              <h2 className="section-heading">Connect With Me</h2>
              <p className="body-text" style={{ marginBottom: '1.25rem' }}>
                If you'd like to connect, collaborate, or just say hi, find me on any of the platforms below.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '0.75rem' }}>

                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/manikanta-srinivas-ala" target="_blank" rel="noopener noreferrer" className="social-tile">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>

                {/* X / Twitter */}
                <a href="https://x.com/srinivasala2732" target="_blank" rel="noopener noreferrer" className="social-tile">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.738-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </a>

                {/* Telegram */}
                <a href="https://t.me/srini1110" target="_blank" rel="noopener noreferrer" className="social-tile">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>

                {/* YouTube */}
                <a href="https://www.youtube.com/watch?v=3JFKWGt6a6s&list=PLKaYCgwGWi7C-JepC9-gmCNBzcZYxAZEM" target="_blank" rel="noopener noreferrer" className="social-tile">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>

                {/* GitHub */}
                <a href="https://github.com/mous9270/upsc" target="_blank" rel="noopener noreferrer" className="social-tile">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </a>

              </div>
            </section>

            {/* ── 4. Suggestions ── */}
            <section className="card p-5 sm:p-7">
              <h2 className="section-heading">Suggestions Welcome</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <p className="body-text">
                  If you have any suggestions, ideas, or feedback that could make this platform better for UPSC aspirants, feel free to reach out.
                </p>
                <p className="body-text">
                  I'd genuinely love to hear from users and improve the platform based on your experience.
                </p>
              </div>
              <a
                href="https://t.me/srini1110"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.4rem', fontSize: '0.88rem' }}
              >
                {/* Telegram icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Reach Out on Telegram
              </a>
            </section>

          </div>
        </main>
      </div>
    </>
  );
};

export default About;