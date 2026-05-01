import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, customerApi, measurementApi } from '../api';
import { 
	ArrowLeft, Clock, CheckCircle, User, Calendar, 
	FileText, Package, Image as ImageIcon, MessageSquare, 
	Mail, Ruler, ChevronRight, Activity, Users, 
	CreditCard, ShoppingCart, AlertCircle, Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const OrderDetailScreen = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { addToCart, isInCart, removeFromCart } = useCart();
	
	const [order, setOrder] = useState<any>(null);
	const [customer, setCustomer] = useState<any>(null);
	const [measurements, setMeasurements] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			fetchOrderData();
		} else {
			setError("No order ID provided");
			setLoading(false);
		}
	}, [id]);

	const fetchOrderData = async () => {
		try {
			setLoading(true);
			setError(null);
			const orderRes = await orderApi.getOne(id!);
			const orderData = orderRes?.data;
			
			if (!orderData) {
				setError("Order not found");
				setLoading(false);
				return;
			}
			
			setOrder(orderData);
			
			if (orderData.customerId) {
				try {
					const [custRes, measRes] = await Promise.all([
						customerApi.getOne(orderData.customerId).catch(() => null),
						measurementApi.getByCustomer(orderData.customerId).catch(() => null)
					]);
					
					if (custRes?.data) setCustomer(custRes.data);
					if (measRes?.data && measRes.data.length > 0) {
						setMeasurements(measRes.data[0].data);
					}
				} catch (subErr) {
					console.warn("Failed to load related customer data", subErr);
				}
			}
		} catch (err: any) {
			console.error('Failed to fetch order data', err);
			setError(err.message || "Failed to load order details");
		} finally {
			setLoading(false);
		}
	};

	const updateStatus = async (newStatus: string) => {
		try {
			await orderApi.updateStatus(id!, newStatus);
			setOrder((prev: any) => ({ ...prev, status: newStatus }));
		} catch (err) {
			console.error('Failed to update status', err);
			alert("Failed to update status. Please try again.");
		}
	};

	const parseSafeNumber = (val: any) => {
		if (val === undefined || val === null || val === '') return 0;
		if (typeof val === 'number') return val;
		const cleanVal = val.toString().replace(/,/g, '');
		const parsed = parseFloat(cleanVal);
		return isNaN(parsed) ? 0 : parsed;
	};

	const handleCheckoutToggle = () => {
		if (order?.customerId) {
			navigate(`/checkout?customerId=${order.customerId}`);
		} else {
			navigate('/checkout');
		}
	};

	const handleWhatsApp = () => {
		if (customer?.phone) {
			const message = `Hello ${customer.firstName}, regarding your order "${order?.title || order?.garmentType}"...`;
			window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
		}
	};

	const handleEmail = () => {
		if (customer?.email) {
			const subject = `Order Update: ${order?.title || order?.garmentType}`;
			const body = `Hello ${customer.firstName}, regarding your order...`;
			window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		}
	};

	if (loading) return (
		<div className="full-center" style={{ height: '60vh', flexDirection: 'column', gap: '1rem' }}>
			<Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
			<p style={{ opacity: 0.5, fontWeight: 600 }}>Loading Production Details...</p>
		</div>
	);

	if (error || !order) return (
		<div className="full-center" style={{ height: '60vh', flexDirection: 'column', gap: '1.5rem' }}>
			<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
				<AlertCircle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
				<h2 style={{ marginBottom: '0.5rem' }}>{error || "Order Not Found"}</h2>
				<p style={{ opacity: 0.6, marginBottom: '2rem' }}>The order you are looking for might have been removed or the ID is incorrect.</p>
				<button className="primary-btn" onClick={() => navigate('/orders')}>Back to Orders</button>
			</div>
		</div>
	);

	const orderInCart = isInCart(order.id);
	const totalPrice = parseSafeNumber(order.price);
	const depositAmount = parseSafeNumber(order.deposit);
	const balance = parseSafeNumber(order.balance || (totalPrice - depositAmount));

	return (
		<div className="order-detail-screen-layout">
			<div className="detail-header-row">
				<button className="back-button" onClick={() => navigate(-1)}>
					<ArrowLeft size={20} />
				</button>
				<div className="header-actions">
					<button className="secondary hide-mobile" onClick={() => window.print()}>
						<FileText size={18} /> Print Invoice
					</button>
					<button 
						className="primary-btn" 
						style={{ width: 'auto' }}
						onClick={handleCheckoutToggle}
						disabled={balance <= 0}
					>
						<CreditCard size={18} /> Settle Balance
					</button>
				</div>
			</div>

			<div className="order-detail-grid-layout">
				<div className="order-main-content">
					<div className="main-content-card">
						<header className="order-main-header">
							<div className="badge-status-container">
								<span className={`status-pill ${order.status?.toLowerCase()}`}>
									{order.status || 'Pending'}
								</span>
							</div>
							<h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{order.title || order.garmentType}</h1>
							<p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Order ID: #{order.id?.slice(-6).toUpperCase()}</p>
						</header>

						<div className="financial-glass-card">
							<div className="f-item">
								<span className="f-label">Total Price</span>
								<span className="f-value">₦{totalPrice.toLocaleString()}</span>
							</div>
							<div className="f-divider"></div>
							<div className="f-item">
								<span className="f-label">Deposit Paid</span>
								<span className="f-value" style={{ color: 'var(--success-color)' }}>₦{depositAmount.toLocaleString()}</span>
							</div>
							<div className="f-divider"></div>
							<div className="f-item highlight-balance">
								<span className="f-label">Balance Due</span>
								<span className="f-value" style={{ color: balance > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
									₦{balance.toLocaleString()}
								</span>
							</div>
						</div>


						{/* Mobile-only quick status changer */}
						<div className="mobile-status-changer show-mobile">
							<label className="mobile-status-label">
								<Activity size={16} /> Update Production Status
							</label>
							<select
								value={order.status || 'Pending'}
								onChange={(e) => updateStatus(e.target.value)}
								className="mobile-status-select"
							>
								{['Pending', 'Cutting', 'Stitching', 'Fitting', 'Finishing', 'Ready', 'Delivered', 'Cancelled'].map(s => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
						</div>

						<div className="section-group hide-mobile">
							<h3 className="group-title"><Activity size={20} color="var(--primary-color)" /> Production Workflow</h3>
							<div className="workflow-stepper">
								{[
									{ id: 'Pending', desc: 'Order received and confirmed' },
									{ id: 'Cutting', desc: 'Fabric is being measured and cut' },
									{ id: 'Stitching', desc: 'Garment is being sewn' },
									{ id: 'Fitting', desc: 'Client trial and adjustments' },
									{ id: 'Finishing', desc: 'Final touches and ironing' },
									{ id: 'Ready', desc: 'Order is ready for pickup' },
									{ id: 'Delivered', desc: 'Order handed over to client' }
								].map((s, idx) => {
									const orderStatuses = ['Pending', 'Cutting', 'Stitching', 'Fitting', 'Finishing', 'Ready', 'Delivered'];
									const orderStatusIdx = orderStatuses.indexOf(order.status || 'Pending');
									const isPast = idx < orderStatusIdx;
									const isCurrent = idx === orderStatusIdx;
									
									return (
										<div 
											key={s.id} 
											className={`step-item ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
											onClick={() => updateStatus(s.id)}
										>
											<div className="step-marker">
												{isPast ? <CheckCircle size={14} /> : idx + 1}
											</div>
											<div className="step-info">
												<div className="step-name">{s.id}</div>
												<div className="step-desc">{s.desc}</div>
											</div>
											{isCurrent && <div className="current-indicator">Current Status</div>}
										</div>
									);
								})}
							</div>
						</div>

						{order.imageUrls && order.imageUrls.length > 0 && (
							<div className="section-group">
								<h3 className="group-title"><ImageIcon size={20} color="var(--primary-color)" /> Style References</h3>
								<div className="style-gallery-modern">
									{order.imageUrls.map((url: string, idx: number) => (
										<div key={idx} className="modern-gallery-item" onClick={() => window.open(url, '_blank')}>
											<img src={url} alt={`Style ${idx}`} />
										</div>
									))}
								</div>
							</div>
						)}

						<div className="section-group" style={{ marginBottom: 0 }}>
							<h3 className="group-title"><FileText size={20} color="var(--primary-color)" /> Special Instructions</h3>
							<div className="notes-box-premium">
								{order.notes || 'No specific instructions provided for this job.'}
							</div>
						</div>
					</div>
				</div>

				<aside className="detail-sidebar">
					<div className="sidebar-card client-profile-mini">
						<div className="client-header-bg"></div>
						<div className="client-info-content">
							<div className="client-avatar-wrapper">
								<img src={customer?.profilePicture || `https://ui-avatars.com/api/?name=${customer?.firstName || 'Walking'}+${customer?.lastName || 'Client'}&background=0F1C3F&color=fff`} alt="" />
							</div>
							<h2 className="client-name">{customer ? `${customer.firstName} ${customer.lastName}` : (order.customerName || 'Walking Client')}</h2>
							<p className="client-location">{customer?.location || 'Client Location Not Set'}</p>
							
							<div className="client-actions-row">
								<button className="circle-action-btn" onClick={handleWhatsApp} disabled={!customer?.phone} title="WhatsApp">
									<MessageSquare size={20} />
								</button>
								<button className="circle-action-btn" onClick={handleEmail} disabled={!customer?.email} title="Email">
									<Mail size={20} />
								</button>
								<button className="circle-action-btn" onClick={() => customer && navigate(`/clients/${customer.id}`)} disabled={!customer} title="Profile">
									<Users size={20} />
								</button>
							</div>
						</div>
					</div>

					<div className="sidebar-card measurements-sidebar">
						<div className="flex-between" style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Measurements</h3>
							<button className="btn-ghost" onClick={() => customer && navigate(`/clients/${customer.id}/measurements/edit`)} disabled={!customer}>Manage</button>
						</div>
						<div className="m-sidebar-list">
							{measurements ? Object.entries(measurements).map(([key, value]) => (
								<div key={key} className="m-sidebar-item">
									<span className="m-name">{key.replace(/([A-Z])/g, ' $1')}</span>
									<span className="m-val">{value as string}"</span>
								</div>
							)) : <p style={{ opacity: 0.5, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No measurements captured yet.</p>}
						</div>
					</div>

					{order.items && order.items.length > 0 && (
						<div className="sidebar-card inventory-sidebar">
							<h3 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Materials Used</h3>
							<div className="m-sidebar-list">
								{order.items.map((item: any, idx: number) => (
									<div key={idx} className="m-sidebar-item">
										<span className="m-name">{item.name || item.itemName}</span>
										<span className="m-val">x{item.quantity}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
};
