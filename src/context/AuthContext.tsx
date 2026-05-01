import React, { createContext, useContext, useState, useEffect } from 'react';
import { setApiBusinessId } from '../api';

interface User {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
}

interface AuthContextType {
	user: User | null;
	businessId: string | null;
	token: string | null;
	isLoading: boolean;
	login: (token: string, user: User, businessId: string) => Promise<void>;
	logout: () => Promise<void>;
	setBusinessId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const BUSINESS_ID_KEY = 'active_business_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [businessId, setBusinessIdState] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadStoredData();
	}, []);

	const loadStoredData = async () => {
		try {
			const storedToken = localStorage.getItem(TOKEN_KEY);
			const storedUser = localStorage.getItem(USER_KEY);
			const storedBusinessId = localStorage.getItem(BUSINESS_ID_KEY);

			if (storedToken && storedUser) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
				if (storedBusinessId) setBusinessIdState(storedBusinessId);

				// Setup api business id
				if (storedBusinessId) {
					setApiBusinessId(storedBusinessId);
				}
			}
		} catch (e) {
			console.error('Failed to load auth data', e);
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (
		newToken: string,
		newUser: User,
		newBusinessId: string,
	) => {
		setToken(newToken);
		setUser(newUser);
		setBusinessIdState(newBusinessId);

		localStorage.setItem(TOKEN_KEY, newToken);
		localStorage.setItem(USER_KEY, JSON.stringify(newUser));
		localStorage.setItem(BUSINESS_ID_KEY, newBusinessId);

		setApiBusinessId(newBusinessId);
	};

	const logout = async () => {
		setToken(null);
		setUser(null);
		setBusinessIdState(null);

		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		localStorage.removeItem(BUSINESS_ID_KEY);

		setApiBusinessId(null);
	};

	const setBusinessId = async (id: string) => {
		setBusinessIdState(id);
		localStorage.setItem(BUSINESS_ID_KEY, id);
		setApiBusinessId(id);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				businessId,
				isLoading,
				login,
				logout,
				setBusinessId,
			}}
		>
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
