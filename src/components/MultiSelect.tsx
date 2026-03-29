import React, { useEffect, useRef, useState } from 'react';

export interface OptionGroup {
    label: string;
    options: string[];
}

interface MultiSelectProps {
    label: string;
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    options?: string[];    // flat list — use when no grouping needed
    groups?: OptionGroup[]; // grouped list — used for topics when multiple subjects selected
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    selected,
    onChange,
    placeholder = 'All',
    disabled = false,
    options,
    groups,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const allOptions = groups ? groups.flatMap(g => g.options) : (options ?? []);

    const toggle = (value: string) => {
        onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
    };

    const triggerText =
        selected.length === 0 ? placeholder :
        selected.length === 1 ? selected[0] :
        `${selected.length} selected`;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <p style={{
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.3rem',
                fontFamily: "'DM Sans', sans-serif",
            }}>
                {label}
            </p>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    padding: '0.45rem 0.7rem',
                    fontSize: '0.85rem',
                    border: `1.5px solid ${open ? 'var(--blue, #1A56A0)' : 'var(--border, #D1DCF0)'}`,
                    borderRadius: '6px',
                    background: disabled ? 'var(--paper-alt, #EEF2F8)' : 'var(--surface, #fff)',
                    color: selected.length ? 'var(--ink, #111827)' : 'var(--ink-muted, #4B5563)',
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textAlign: 'left',
                    minWidth: 0,
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {triggerText}
                </span>
                {selected.length > 0 && (
                    <span style={{
                        background: 'var(--blue, #1A56A0)', color: '#fff',
                        borderRadius: '99px', fontSize: '0.65rem',
                        padding: '0.1rem 0.45rem', fontWeight: 700, flexShrink: 0,
                    }}>
                        {selected.length}
                    </span>
                )}
                <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--surface, #fff)',
                    border: '1.5px solid var(--blue, #1A56A0)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    zIndex: 200,
                    maxHeight: '260px',
                    overflowY: 'auto',
                }}>
                    {/* Select all / Clear controls */}
                    <div style={{
                        display: 'flex', gap: '0.75rem', padding: '0.45rem 0.75rem',
                        borderBottom: '1px solid var(--border, #D1DCF0)',
                        background: 'var(--surface, #fff)', position: 'sticky', top: 0,
                    }}>
                        <button
                            type="button"
                            onClick={() => onChange(allOptions)}
                            style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--blue, #1A56A0)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                        >
                            Select all
                        </button>
                        <span style={{ color: 'var(--border, #D1DCF0)' }}>·</span>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-muted, #4B5563)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                        >
                            Clear
                        </button>
                    </div>

                    {allOptions.length === 0 ? (
                        <p style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: 'var(--ink-muted, #4B5563)', fontFamily: "'DM Sans', sans-serif" }}>
                            No options available
                        </p>
                    ) : groups ? (
                        groups.map(group => (
                            <div key={group.label}>
                                <div style={{
                                    padding: '0.35rem 0.75rem 0.25rem',
                                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em',
                                    textTransform: 'uppercase', color: 'var(--blue, #1A56A0)',
                                    background: 'var(--blue-lt, #E8F0FA)',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>
                                    {group.label}
                                </div>
                                {group.options.map(opt => (
                                    <label key={opt} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.38rem 0.75rem 0.38rem 1.25rem',
                                        cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink, #111827)',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(opt)}
                                            onChange={() => toggle(opt)}
                                            style={{ accentColor: 'var(--blue, #1A56A0)', flexShrink: 0, cursor: 'pointer' }}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        ))
                    ) : (
                        (options ?? []).map(opt => (
                            <label key={opt} style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.38rem 0.75rem',
                                cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink, #111827)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt)}
                                    onChange={() => toggle(opt)}
                                    style={{ accentColor: 'var(--blue, #1A56A0)', flexShrink: 0, cursor: 'pointer' }}
                                />
                                {opt}
                            </label>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
