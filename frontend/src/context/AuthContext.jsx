import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    });
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || (user?.role || 'user'));

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setViewMode(userData.role);
        localStorage.setItem('viewMode', userData.role);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('viewMode');
    };

    const switchViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('viewMode', mode);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, viewMode, switchViewMode }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
