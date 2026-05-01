import { useState, useEffect } from 'react';
import { customerApi, orderApi, inventoryApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, ShoppingBag, Package, ArrowRight, AlertCircle, Clock, DollarSign, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomeScreen = () => {
	const { user } = useAuth();
	const [customerCount, setCustomerCount] = useState(0);
	const [orderCount, setOrderCount] = useState(0);
	const [inventoryCount, setInventoryCount] = useState(0);
	const [lowStockItems, setLowStockItems] = useState<any[]>([]);
	const [recentOrders, setRecentOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Financials
	const [stats, setStats] = useState({
		totalRevenue: 0,
		monthlyRevenue: 0,
		weeklyRevenue: 0,
		completedOrders: 0,
		inProgressOrders: 0,
		pendingOrders: 0
	});

	useEffect(() => {
		loadData();
	}, []);

	const parseSafeNumber = (val: any) => {
		if (val === undefined || val === null) return 0;
		if (typeof val === 'number') return val;
		const parsed = parseFloat(val.toString().replace(/,/g, ''));
		return isNaN(parsed) ? 0 : parsed;
	};

	const loadData = async () => {
		try {
			const [customersRes, ordersRes, inventoryRes] = await Promise.all([
				customerApi.getAll(),
				orderApi.getAll(),
				inventoryApi.getAll(),
			]);
			
			const allOrders = ordersRes.data;
			setCustomerCount(customersRes.data.length);
			setOrderCount(allOrders.length);
			setInventoryCount(inventoryRes.data.length);
			
			// Financial & Status Calculations
			let total = 0;
			let monthly = 0;
			let weekly = 0;
			let completed = 0;
			let inProgress = 0;
			let pending = 0;

			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() - now.getDay());

			allOrders.forEach((order: any) => {
				const price = parseSafeNumber(order.price);
				total += price;

				const createdDate = new Date(order.createdAt || 0);
				if (createdDate >= startOfMonth) monthly += price;
				if (createdDate >= startOfWeek) weekly += price;

				const status = order.status?.toLowerCase();
				if (['completed', 'delivered', 'ready'].includes(status)) {
					completed++;
				} else if (['pending'].includes(status)) {
					pending++;
				} else if (status && !['cancelled'].includes(status)) {
					inProgress++;
				}
			});

			setStats({
				totalRevenue: total,
				monthlyRevenue: monthly,
				weeklyRevenue: weekly,
				completedOrders: completed,
				inProgressOrders: inProgress,
				pendingOrders: pending
			});

			// Get items with quantity < threshold
			setLowStockItems(inventoryRes.data.filter((item: any) => {
				const qty = item.qtyOnHand !== undefined ? item.qtyOnHand : item.quantity;
				const threshold = item.lowStockThreshold || 5;
				return qty < threshold;
			}).slice(0, 5));
			
			// Get 5 most recent orders
			const sortedOrders = allOrders.sort((a: any, b: any) => 
				new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
			).slice(0, 5);
			setRecentOrders(sortedOrders);
			
		} catch (error) {
			console.error('Failed to load dashboard data', error);
		} finally {
			setLoading(false);
		}
	};

	const formatSafeDate = (dateVal: any) => {
		if (!dateVal) return 'No date';
		try {
			if (dateVal && typeof dateVal.toDate === 'function') {
				return dateVal.toDate().toLocaleDateString();
			}
			const d = new Date(dateVal);
			if (isNaN(d.getTime())) return 'No date';
			return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		} catch (e) {
			return 'No date';
		}
	};

	if (loading) {
		return <div className="loader"></div>;
	}

	return (
		<div className="dashboard-container">
			<header className="dashboard-header">
				<div className="flex-between">
					<div>
						<h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Studio Dashboard</h1>
						<p>Track your production and financials in real-time</p>
					</div>
					<div className="flex items-center gap-3 hide-mobile">
						<div className="status-pill ready" style={{ padding: '0.5rem 1rem' }}>
							<Calendar size={14} /> {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
						</div>
					</div>
				</div>
			</header>

			<div className="stats-overview-grid">
				<div className="card mini-stat-card">
					<div className="flex-between mb-2">
						<span className="label">Total Revenue</span>
						<TrendingUp size={16} color="var(--success-color)" />
					</div>
					<div className="value">₦{stats.totalRevenue.toLocaleString()}</div>
					<div className="trend" style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.5rem' }}>Life-time earnings</div>
				</div>
				<div className="card mini-stat-card">
					<div className="flex-between mb-2">
						<span className="label">Monthly Growth</span>
						<Activity size={16} color="var(--primary-color)" />
					</div>
					<div className="value">₦{stats.monthlyRevenue.toLocaleString()}</div>
					<div className="trend" style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.5rem' }}>Current billing period</div>
				</div>
				<div className="card mini-stat-card">
					<div className="flex-between mb-2">
						<span className="label">Active Jobs</span>
						<Clock size={16} color="#f39c12" />
					</div>
					<div className="value">{stats.inProgressOrders}</div>
					<div className="trend" style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.5rem' }}>Across all production stages</div>
				</div>
				<div className="card mini-stat-card">
					<div className="flex-between mb-2">
						<span className="label">Orders Ready</span>
						<ShoppingBag size={16} color="var(--success-color)" />
					</div>
					<div className="value">{stats.completedOrders}</div>
					<div className="trend" style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.5rem' }}>Pending delivery</div>
				</div>
			</div>

			<div className="dashboard-grid" style={{ marginTop: '2.5rem' }}>
				<Link to="/clients" className="card dashboard-card luxury-hover">
					<div className="card-icon clients-icon">
						<Users size={24} />
					</div>
					<div className="card-content">
						<h3>{customerCount}</h3>
						<p>Total Client Base</p>
					</div>
					<ArrowRight size={16} className="card-arrow" />
				</Link>

				<Link to="/orders" className="card dashboard-card luxury-hover">
					<div className="card-icon orders-icon">
						<ShoppingBag size={24} />
					</div>
					<div className="card-content">
						<h3>{orderCount}</h3>
						<p>Production Pipeline</p>
					</div>
					<ArrowRight size={16} className="card-arrow" />
				</Link>

				<Link to="/inventory" className="card dashboard-card luxury-hover">
					<div className="card-icon inventory-icon">
						<Package size={24} />
					</div>
					<div className="card-content">
						<h3>{inventoryCount}</h3>
						<p>Material & Supplies</p>
					</div>
					<ArrowRight size={16} className="card-arrow" />
				</Link>
			</div>

			<div className="activity-layout-grid" style={{ marginTop: '2.5rem' }}>
				<section>
					<div className="flex-between" style={{ marginBottom: '1.25rem' }}>
						<h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
							<Activity size={18} color="var(--primary-color)" /> Production Activity
						</h3>
						<Link to="/orders" className="text-btn">Explore All</Link>
					</div>
					<div className="card activity-list">
						{recentOrders.length === 0 ? (
							<div className="empty-mini">No recent activity</div>
						) : (
							recentOrders.map(order => (
								<Link key={order.id} to={`/orders/${order.id}`} className="activity-item">
									<div className="activity-icon-box">
										<Clock size={16} />
									</div>
									<div className="activity-info">
										<div className="title">{order.title || order.garmentType}</div>
										<div className="subtitle">Due {formatSafeDate(order.dueDate || order.deliveryDate)}</div>
									</div>
									<span className={`status-badge-mini ${order.status?.toLowerCase()}`}>
										{order.status || 'Pending'}
									</span>
								</Link>
							))
						)}
					</div>
				</section>

				<section>
					<div className="flex-between" style={{ marginBottom: '1.25rem' }}>
						<h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
							<AlertCircle size={18} color="var(--danger-color)" /> Inventory Warnings
						</h3>
						<Link to="/inventory" className="text-btn">Restock Now</Link>
					</div>
					<div className="card activity-list">
						{lowStockItems.length === 0 ? (
							<div className="empty-mini">Stock levels are healthy</div>
						) : (
							lowStockItems.map(item => (
								<Link key={item.id} to={`/inventory/${item.id}`} className="activity-item">
									<div className="activity-icon-box danger">
										<Package size={16} />
									</div>
									<div className="activity-info">
										<div className="title">{item.itemName || item.name}</div>
										<div className="subtitle">{item.category}</div>
									</div>
									<div className="stock-warning-label">
										{item.qtyOnHand !== undefined ? item.qtyOnHand : item.quantity} {item.unit} left
									</div>
								</Link>
							))
						)}
					</div>
				</section>
			</div>

			<div className="dashboard-cta-banner">
				<div className="banner-content">
					<h2>Take a New Order?</h2>
					<p>Quickly capture measurements and initiate a new production job.</p>
					<div className="banner-buttons">
						<Link to="/orders/new" className="banner-primary-btn">
							Start New Job
						</Link>
						<Link to="/clients" className="banner-secondary-btn">
							View Clients
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
