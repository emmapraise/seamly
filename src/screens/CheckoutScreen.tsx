import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi, customerApi, paymentApi } from '../api';
import { ArrowLeft, Trash2, CreditCard, ShoppingBag, ShieldCheck, User, Search, Loader2, CheckCircle, X, ChevronRight } from 'lucide-react';

export const CheckoutScreen = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const urlCustomerId = searchParams.get('customerId');

	const [searchTerm, setSearchTerm] = useState('');
	const [customers, setCustomers] = useState<any[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
	const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		if (urlCustomerId) {
			loadCustomerAndOrders(urlCustomerId);
		}
	}, [urlCustomerId]);

	const loadCustomerAndOrders = async (custId: string) => {
		try {
			setLoading(true);
			const [custRes, ordersRes] = await Promise.all([
				customerApi.getOne(custId),
				orderApi.getByCustomer(custId)
			]);
			
			setSelectedCustomer(custRes.data);
			const unpaid = (ordersRes.data || []).filter((o: any) => {
				const balance = parseFloat((o.balance !== undefined ? o.balance : (o.price - o.deposit)).toString().replace(/,/g, ''));
				return balance > 0;
			});
			setUnpaidOrders(unpaid);
			setSelectedOrderIds(unpaid.map((o: any) => o.id));
		} catch (error) {
			console.error('Failed to load checkout data', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const term = e.target.value;
		setSearchTerm(term);
		if (term.length > 2) {
			try {
				const res = await customerApi.getAll();
				if (res?.data) {
					const filtered = res.data.filter((c: any) => 
						`${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(term.toLowerCase()) ||
						(c.phone && c.phone.includes(term))
					);
					setCustomers(filtered);
				}
			} catch (err) {
				console.error("Search failed", err);
			}
		} else {
			setCustomers([]);
		}
	};

	const selectCustomer = (cust: any) => {
		setSelectedCustomer(cust);
		setCustomers([]);
		setSearchTerm('');
		loadCustomerAndOrders(cust.id);
	};

	const toggleOrderSelection = (id: string) => {
		setSelectedOrderIds(prev => 
			prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
		);
	};

	const calculateTotal = () => {
		return unpaidOrders
			.filter(o => selectedOrderIds.includes(o.id))
			.reduce((sum, o) => sum + parseFloat((o.balance !== undefined ? o.balance : (o.price - o.deposit)).toString().replace(/,/g, '')), 0);
	};

	const handleProcessPayment = async () => {
		if (selectedOrderIds.length === 0) return;
		
		try {
			setProcessing(true);
			const selectedOrders = unpaidOrders.filter(o => selectedOrderIds.includes(o.id));
			const totalAmount = calculateTotal();
			
			await paymentApi.create({
				customerId: selectedCustomer.id,
				customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
				amount: totalAmount,
				orderIds: selectedOrderIds,
				orderTitles: selectedOrders.map(o => o.title || o.garmentType).join(', '),
				paymentMethod: 'Studio Checkout',
				type: 'Production Payment'
			});

			alert('Payment successful! Order balances have been updated.');
			navigate('/payments');
		} catch (error) {
			console.error('Payment failed', error);
			alert('Failed to process payment.');
		} finally {
			setProcessing(false);
		}
	};

	return (
		<div className="checkout-screen-v2 container-luxury">
			<header className="page-header-luxury animate-fade-in">
				<div>
					<button className="back-button" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
						<ArrowLeft size={20} /> Back
					</button>
					<h1 className="text-gradient">Studio Settlement</h1>
					<p>Finalize production jobs and process client payments</p>
				</div>
				<div className="header-badge hide-mobile">
					<ShieldCheck size={20} />
					<span>Secure Transaction</span>
				</div>
			</header>

			<div className="checkout-main-grid">
				<div className="checkout-left-pane">
					{!selectedCustomer ? (
						<div className="card glass-card animate-slide-up">
							<h3 style={{ marginBottom: '1.5rem' }}>Find Client</h3>
							<div style={{ position: 'relative' }}>
								<div className="search-box-modern" style={{ maxWidth: '100%' }}>
									<Search size={20} />
									<input 
										type="text" 
										placeholder="Search by name or phone..." 
										value={searchTerm}
										onChange={handleSearch}
									/>
								</div>
								
								{customers.length > 0 && (
									<div className="search-results-list-modern">
										{customers.map(c => (
											<div key={c.id} className="search-result-item luxury-hover" onClick={() => selectCustomer(c)}>
												<div className="c-avatar">
													<img src={c.profilePicture || `https://ui-avatars.com/api/?name=${c.firstName}+${c.lastName}`} alt="" />
												</div>
												<div className="c-info">
													<span className="c-name">{c.firstName} {c.lastName}</span>
													<span className="c-phone">{c.phone}</span>
												</div>
												<ChevronRight size={18} className="arrow" />
											</div>
										))}
									</div>
								)}
							</div>

							<div className="pos-empty-state">
								<div className="icon-bg-circle">
									<User size={32} />
								</div>
								<p>Start typing to search for a client and settle their accounts</p>
							</div>
						</div>
					) : (
						<div className="active-customer-session animate-fade-in">
							<div className="card glass-card customer-summary-card-modern luxury-hover animate-slide-up">
								<div className="flex-between">
									<div className="flex items-center gap-6">
										<div className="session-avatar-large">
											<img src={selectedCustomer.profilePicture || `https://ui-avatars.com/api/?name=${selectedCustomer.firstName}+${selectedCustomer.lastName}`} alt="" />
										</div>
										<div>
											<h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
											<div className="client-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
												<span>{selectedCustomer.phone}</span>
												<div className="dot-luxury"></div>
												<span>{selectedCustomer.email || 'Client Member'}</span>
											</div>
										</div>
									</div>
									<button className="close-session-btn" onClick={() => setSelectedCustomer(null)} title="Change Client">
										<X size={22} />
									</button>
								</div>
								
								<div className="client-quick-stats">
									<div className="q-stat">
										<span className="label">Production Orders</span>
										<span className="val">{unpaidOrders.length} Pending Settlement</span>
									</div>
									<div className="q-stat">
										<span className="label">Studio Status</span>
										<span className="val">Active Session</span>
									</div>
								</div>
							</div>

							<div className="unpaid-orders-section">
								<div className="flex-between section-header">
									<h3>Outstanding Jobs</h3>
									<span className="jobs-count">{unpaidOrders.length} Pending</span>
								</div>
								
								{loading ? (
									<div className="flex-center" style={{ padding: '6rem' }}>
										<Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
									</div>
								) : unpaidOrders.length === 0 ? (
									<div className="card glass-card empty-orders-card-modern">
										<div className="success-icon-bg">
											<CheckCircle size={32} />
										</div>
										<h3>All Accounts Settled</h3>
										<p>This client has no outstanding production balances at the moment.</p>
									</div>
								) : (
									<div className="orders-to-settle-list-modern">
										{unpaidOrders.map((order, idx) => {
											const balance = parseFloat((order.balance !== undefined ? order.balance : (order.price - order.deposit)).toString().replace(/,/g, ''));
											const isSelected = selectedOrderIds.includes(order.id);
											return (
												<div 
													key={order.id} 
													className={`checkout-order-card-modern glass-card luxury-hover ${isSelected ? 'selected' : ''}`}
													onClick={() => toggleOrderSelection(order.id)}
													style={{ animationDelay: `${idx * 0.1}s` }}
												>
													<div className="selection-box">
														{isSelected ? (
															<div className="check-active"><CheckCircle size={22} fill="var(--primary-color)" color="white" /></div>
														) : (
															<div className="check-inactive" />
														)}
													</div>
													<div className="order-main">
														<span className="garment-badge">{order.garmentType}</span>
														<h4>{order.title || "Production Order"}</h4>
														<div className="order-meta">
															<span className="id">#{order.id.slice(-6).toUpperCase()}</span>
															<span className="dot"></span>
															<span>{new Date(order.createdAt).toLocaleDateString()}</span>
														</div>
													</div>
													<div className="order-pricing-v2">
														<span className="label">Amount Due</span>
														<span className="val">₦{balance.toLocaleString()}</span>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				<aside className="checkout-right-pane">
					<div className="card glass-card settlement-final-card-modern luxury-hover">
						<h3 className="card-title">Settlement Summary</h3>
						
						<div className="settlement-breakdown-modern">
							<div className="s-row">
								<span className="label">Client</span>
								<span className="val-bold">{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Not Selected'}</span>
							</div>
							<div className="s-row">
								<span className="label">Selected Orders</span>
								<span className="val">{selectedOrderIds.length}</span>
							</div>
							<div className="s-divider"></div>
							<div className="s-row total-row">
								<span className="label">Total to Settle</span>
								<span className="final-amount">₦{calculateTotal().toLocaleString()}</span>
							</div>
						</div>

						<button 
							className="primary-btn-modern finalize-btn-v2" 
							disabled={!selectedCustomer || selectedOrderIds.length === 0 || processing}
							onClick={handleProcessPayment}
						>
							{processing ? (
								<Loader2 className="animate-spin" size={24} />
							) : (
								<><CreditCard size={22} /> Finalize Payment</>
							)}
						</button>
						
						<div className="secure-footer">
							<ShieldCheck size={14} />
							<span>Instant Ledger Synchronized</span>
						</div>
					</div>

					<div className="card glass-card info-card-modern">
						<h4>Payment Logic</h4>
						<p>Processing this settlement will automatically update individual order balances and mark them as ready if fully paid.</p>
					</div>
				</aside>
			</div>
		</div>
	);
};
