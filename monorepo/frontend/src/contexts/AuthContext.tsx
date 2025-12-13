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
    login: (email: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = async (email: string) => {
        // Mock Login Logic
        console.log(`Authenticating against: ${API_BASE_URL} (Mock)`);
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setUser({
                    id: '1',
                    email: email,
                    name: email.split('@')[0]
                });
                resolve();
            }, 500); // Simulate network delay
        });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            logout
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
