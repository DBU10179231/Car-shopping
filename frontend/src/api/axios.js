import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5008/api',
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            // Token is invalid or expired — clear session and redirect
            localStorage.removeItem('user');
            localStorage.removeItem('viewMode');
            window.location.href = '/login';
        } else if (status === 403) {
            // Account is banned or missing required permissions
            const message = error.response?.data?.message || '';
            if (message.toLowerCase().includes('banned')) {
                // Banned account — force logout
                localStorage.removeItem('user');
                localStorage.removeItem('viewMode');
                window.location.href = '/login?reason=banned';
            }
            // Other 403s (wrong role, missing permission) are passed through
        }
        return Promise.reject(error);
    }
);

export default api;
