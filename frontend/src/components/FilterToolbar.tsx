// src/components/FilterToolbar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Funnel } from 'react-bootstrap-icons';
import { classGroupedColors } from '../constants';


interface Props {
    onFilterChange: (className: string) => void;
    selectedFilters: string[];
    classOptions: { value: string; label: string }[];
}

const FilterToolbar: React.FC<Props> = ({ onFilterChange, selectedFilters, classOptions }) => {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="position-fixed bottom-0 start-0 m-3 z-3" style={{ width: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }} ref={panelRef}>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="bg-white shadow rounded p-3 mb-2"
                            style={{ position: 'absolute', bottom: '70px', left: 0 }}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="d-flex flex-wrap gap-2">
                                {classOptions.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => onFilterChange(value)}
                                        className={`badge rounded-pill border border-dark px-3 py-2 text-dark fw-semibold`}
                                        style={{
                                            backgroundColor: classGroupedColors[value.toLowerCase()] || '#eee',
                                            opacity: selectedFilters.includes(value) ? 1 : 0.5,
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    className="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center"
                    style={{ width: 56, height: 56 }}
                    onClick={() => setOpen(!open)}
                >
                    <Funnel size={24} />
                </button>
            </div>
        </div>
    );
};

export default FilterToolbar;
