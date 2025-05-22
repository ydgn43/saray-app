import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'react-bootstrap-icons'; // Or use any icon you prefer

const BackToTopButton: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 300); // Show after 300px scroll
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            aria-label="Yukarı dön"
            onClick={handleClick}
            className="btn btn-primary shadow rounded-circle"
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1050,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'opacity 0.3s',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <ArrowUp size={28} />
        </button>
    );
};

export default BackToTopButton;
