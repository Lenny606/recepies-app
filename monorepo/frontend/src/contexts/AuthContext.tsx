import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '../config';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isInitialLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                return data.access_token;
            }
        } catch (error) {
            console.error('Refresh token failed:', error);
        }

        logout();
        return null;
    };

    const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                const retryHeaders = {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`
                };
                response = await fetch(url, { ...options, headers: retryHeaders });
            }
        }

        return response;
    };

    const fetchUserProfile = async (token: string) => {
        const userResponse = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser({
                id: userData.id || userData._id,
                email: userData.email,
                name: userData.email.split('@')[0]
            });
            return true;
        }
        return false;
    };

    React.useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const success = await fetchUserProfile(token);
                    if (!success) {
                        const newToken = await refreshAccessToken();
                        if (newToken) {
                            await fetchUserProfile(newToken);
                        }
                    }
                } catch (error) {
                    console.error('Failed to initialize auth:', error);
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        await fetchUserProfile(newToken);
                    }
                }
            }
            setIsInitialLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: email,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        const { access_token, refresh_token } = data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        await fetchUserProfile(access_token);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!localStorage.getItem('access_token'),
            isInitialLoading,
            login,
            logout,
            authenticatedFetch
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
