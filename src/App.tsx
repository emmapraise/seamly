import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { CustomerProfileScreen } from './screens/CustomerProfileScreen';
import { MeasurementEditScreen } from './screens/MeasurementEditScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderCreateScreen } from './screens/OrderCreateScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { InventoryDetailScreen } from './screens/InventoryDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Layout } from './components/Layout';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { token, isLoading } = useAuth();
	if (isLoading) return <div className="full-center"><div className="loader"></div></div>;
	if (!token) return <Navigate to="/login" replace />;
	return <>{children}</>;
};

const AppContent = () => {
	return (
		<Routes>
			<Route path="/login" element={<LoginScreen />} />
			<Route path="/register" element={<RegisterScreen />} />
			
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				}
			>
				<Route index element={<HomeScreen />} />
				<Route path="clients" element={<ClientsScreen />} />
				<Route path="clients/:id" element={<CustomerProfileScreen />} />
				<Route path="clients/:customerId/measurements/edit" element={<MeasurementEditScreen />} />
				<Route path="orders" element={<OrdersScreen />} />
				<Route path="orders/new" element={<OrderCreateScreen />} />
				<Route path="orders/:id" element={<OrderDetailScreen />} />
				<Route path="inventory" element={<InventoryScreen />} />
				<Route path="inventory/:id" element={<InventoryDetailScreen />} />
				<Route path="settings" element={<SettingsScreen />} />
				<Route path="checkout" element={<CheckoutScreen />} />
				<Route path="payments" element={<PaymentsScreen />} />
			</Route>
		</Routes>
	);
};

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<ThemeProvider>
					<CartProvider>
						<AppContent />
					</CartProvider>
				</ThemeProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
