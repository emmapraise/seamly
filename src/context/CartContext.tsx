import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
	id: string;
	title: string;
	garmentType: string;
	customerId: string;
	customerName: string;
	balance: number;
	price: number;
	deposit: number;
}

interface CartContextType {
	cart: CartItem[];
	addToCart: (item: CartItem) => void;
	removeFromCart: (id: string) => void;
	clearCart: () => void;
	isInCart: (id: string) => boolean;
	totalBalance: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [cart, setCart] = useState<CartItem[]>(() => {
		const saved = localStorage.getItem('arcseams_cart');
		return saved ? JSON.parse(saved) : [];
	});

	useEffect(() => {
		localStorage.setItem('arcseams_cart', JSON.stringify(cart));
	}, [cart]);

	const addToCart = (item: CartItem) => {
		if (item.balance <= 0) return; // Only allow unpaid/partial
		setCart((prev) => {
			if (prev.find(i => i.id === item.id)) return prev;
			return [...prev, item];
		});
	};

	const removeFromCart = (id: string) => {
		setCart((prev) => prev.filter(i => i.id !== id));
	};

	const clearCart = () => setCart([]);

	const isInCart = (id: string) => cart.some(i => i.id === id);

	const totalBalance = cart.reduce((acc, item) => acc + (item.balance || (item.price - item.deposit)), 0);

	return (
		<CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isInCart, totalBalance }}>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) throw new Error('useCart must be used within a CartProvider');
	return context;
};
