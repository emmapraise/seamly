import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi, customerApi } from '../api';
import { ShoppingBag, Plus, Search, Filter, ChevronRight, Calendar, User, DollarSign } from 'lucide-react';

export const OrdersScreen = () => {
	const navigate = useNavigate();
	const [orders, setOrders] = useState<any[]>([]);
	const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState('all');

	const statuses = ['all', 'Pending', 'Cutting', 'Stitching', 'Fitting', 'Finishing', 'Ready', 'Delivered', 'Cancelled'];

	useEffect(() => {
		loadOrders();
	}, []);

	useEffect(() => {
		let result = orders;
		
		if (filterStatus !== 'all') {
			result = result.filter(o => o.status?.toLowerCase() === filterStatus.toLowerCase());
		}
		
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(o => 
				(o.title || o.garmentType || '').toLowerCase().includes(query) ||
				(o.customerName || '').toLowerCase().includes(query)
			);
		}
		
		setFilteredOrders(result);
	}, [filterStatus, searchQuery, orders]);

	const loadOrders = async () => {
		try {
			setLoading(true);
			const [ordersRes, clientsRes] = await Promise.all([
				orderApi.getAll(),
				customerApi.getAll()
			]);
			
			const clientMap: Record<string, string> = {};
			clientsRes.data.forEach((c: any) => {
				clientMap[c.id] = `${c.firstName} ${c.lastName}`;
			});

			const sortedOrders = ordersRes.data.sort((a: any, b: any) => {
				return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
			}).map((o: any) => ({
				...o,
				customerName: clientMap[o.customerId] || o.customerName || 'Walking Client'
			}));
			
			setOrders(sortedOrders);
		} catch (error) {
			console.error('Failed to load orders', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <div className="loader"></div>;

	return (
		<div className="orders-screen-container">
			<header className="flex-between" style={{ marginBottom: '2.5rem' }}>
				<div>
					<h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Production Orders</h1>
					<p>Manage and track all active tailoring jobs</p>
				</div>
				<button className="primary-btn hide-mobile" style={{ width: 'auto' }} onClick={() => navigate('/orders/new')}>
					<Plus size={18} /> Create New Job
				</button>
			</header>

			<div className="search-filter-section card" style={{ padding: '1rem', marginBottom: '2rem', borderRadius: '20px' }}>
				<div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
					<div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
						<Search size={18} className="search-icon" />
						<input 
							type="text" 
							placeholder="Search by garment type or client name..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={{ paddingLeft: '3rem' }}
						/>
					</div>
					<div className="hide-mobile" style={{ height: '30px', width: '1px', background: 'var(--border-color)' }}></div>
					<div className="flex items-center gap-2">
						<Filter size={18} style={{ opacity: 0.5 }} />
						<span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter:</span>
					</div>
				</div>
				
				<div className="filter-bar-scrollable" style={{ marginTop: '1rem', paddingBottom: '0.5rem' }}>
					{statuses.map(status => (
						<button 
							key={status}
							className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
							onClick={() => setFilterStatus(status)}
						>
							{status}
						</button>
					))}
				</div>
			</div>

			<div className="mobile-fab show-mobile" onClick={() => navigate('/orders/new')}>
				<Plus size={24} />
			</div>

			{filteredOrders.length === 0 ? (
				<div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: '32px' }}>
					<div className="empty-state-icon" style={{ background: 'var(--surface-hover)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
						<ShoppingBag size={40} style={{ opacity: 0.2 }} />
					</div>
					<h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No orders found</h3>
					<p style={{ maxWidth: '400px', margin: '0 auto' }}>
						{searchQuery || filterStatus !== 'all' 
							? "We couldn't find any orders matching your criteria. Try adjusting your search or filters." 
							: "You haven't created any orders yet. Start by taking a client's measurements and creating a new job."}
					</p>
					{(searchQuery || filterStatus !== 'all') && (
						<button 
							className="secondary-btn" 
							style={{ width: 'auto', marginTop: '2rem', marginInline: 'auto' }}
							onClick={() => {setSearchQuery(''); setFilterStatus('all');}}
						>
							Clear All Filters
						</button>
					)}
				</div>
			) : (
				<div className="orders-grid">
					{filteredOrders.map((order) => (
						<Link 
							key={order.id} 
							to={`/orders/${order.id}`}
							className="card order-luxury-card"
						>
							<div className="order-card-header">
								<div className="garment-badge">
									<ShoppingBag size={14} /> {order.garmentType || 'Garment'}
								</div>
								<span className={`status-badge-mini ${order.status?.toLowerCase()}`}>
									{order.status || 'Pending'}
								</span>
							</div>
							
							<h3 className="order-card-title">{order.title || order.garmentType}</h3>
							
							<div className="order-card-details">
								<div className="detail-item">
									<User size={14} />
									<span>{order.customerName || 'Walking Client'}</span>
								</div>
								<div className="detail-item">
									<Calendar size={14} />
									<span>Due {order.dueDate ? new Date(order.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}</span>
								</div>
							</div>
							
							<div className="order-card-footer">
								<div className="price-tag" style={{ color: 'var(--primary-color)', fontWeight: 800 }}>
									<span>₦{parseFloat(order.price || 0).toLocaleString()}</span>
								</div>
								<div className="view-link">
									View Details <ChevronRight size={14} />
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
};
