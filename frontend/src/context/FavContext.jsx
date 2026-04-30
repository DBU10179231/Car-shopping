import { createContext, useContext, useState } from 'react';

const FavContext = createContext();

export const FavProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
    });

    const toggleFav = (car) => {
        setFavorites(prev => {
            const exists = prev.find(c => c._id === car._id);
            const updated = exists ? prev.filter(c => c._id !== car._id) : [...prev, car];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    };

    const removeFromFavs = (id) => {
        setFavorites(prev => {
            const updated = prev.filter(c => c._id !== id);
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    };

    // Phase 12 Fix: Validate favorites if they look stale (optional, but good for robustness)
    const validateFavs = (validIds) => {
        setFavorites(prev => {
            const updated = prev.filter(c => validIds.includes(c._id));
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    };

    const isFav = (id) => (favorites || []).some(c => c._id === id);

    return (
        <FavContext.Provider value={{ favorites, toggleFav, isFav, removeFromFavs }}>
            {children}
        </FavContext.Provider>
    );
};

export const useFav = () => useContext(FavContext);
