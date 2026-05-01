import React, { useState, useEffect } from 'react';
import { paymentApi } from '../api';
import { CreditCard, Calendar, User, ShoppingBag, ArrowUpRight, Search, Filter, Banknote } from 'lucide-react';

export const PaymentsScreen = () => {
	const [payments, setPayments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		fetchPayments();
	}, []);

	const fetchPayments = async () => {
		try {
			setLoading(true);
			const res = await paymentApi.getAll();
			// Sort by date descending
			const sorted = (res.data || []).sort((a: any, b: any) => 
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
			setPayments(sorted);
		} catch (error) {
			console.error('Failed to fetch payments', error);
		} finally {
			setLoading(false);
		}
	};

	const filteredPayments = payments.filter(p => 
		p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		p.orderTitles?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (loading) return <div className="loader-container"><div className="loader"></div></div>;

	return (
		<div className="payments-screen container-luxury">
			<header className="page-header-luxury animate-fade-in">
				<div>
					<h1 className="text-gradient">Financial Ledger</h1>
					<p>Audit trail for all production settlements and settlements</p>
				</div>
				<div className="revenue-summary-modern glass-card">
					<div className="rev-icon">
						<Banknote size={24} />
					</div>
					<div>
						<span className="rev-label">Total Revenue</span>
						<span className="rev-value">₦{payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}</span>
					</div>
				</div>
			</header>

			<div className="table-actions-row-modern">
				<div className="search-box-modern">
					<Search size={18} />
					<input 
						type="text" 
						placeholder="Search by client or order description..." 
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="filter-group hide-mobile">
					<button className="secondary-btn-modern">
						<Calendar size={18} /> This Month
					</button>
					<button className="secondary-btn-modern active">
						<Filter size={18} /> All Transactions
					</button>
				</div>
			</div>

			<div className="payments-list-container-modern">
				{filteredPayments.length === 0 ? (
					<div className="card glass-card empty-state-v2 animate-slide-up">
						<CreditCard size={64} style={{ opacity: 0.05, marginBottom: '2rem' }} />
						<h3>No Records Found</h3>
						<p>You haven't processed any settlements yet. Start at the Checkout screen.</p>
					</div>
				) : (
					<div className="payments-grid-modern">
						{filteredPayments.map((payment, idx) => (
							<div 
								key={payment.id} 
								className="payment-card-premium glass-card luxury-hover animate-slide-up"
								style={{ animationDelay: `${idx * 0.05}s` }}
							>
								<div className="p-header-v2">
									<div className="p-badge success">
										<div className="dot"></div>
										Paid
									</div>
									<span className="p-time">{new Date(payment.createdAt).toLocaleDateString()}</span>
								</div>

								<div className="p-amount-area">
									<span className="p-label">Amount Settled</span>
									<h2 className="p-val">₦{payment.amount?.toLocaleString()}</h2>
								</div>
								
								<div className="p-details-v2">
									<div className="detail-row">
										<User size={14} />
										<span className="name">{payment.customerName}</span>
									</div>
									<div className="detail-row">
										<ShoppingBag size={14} />
										<span className="orders text-truncate">{payment.orderTitles}</span>
									</div>
								</div>

								<div className="p-footer-v2">
									<div className="p-id-pill">
										TXN-{payment.id.slice(-6).toUpperCase()}
									</div>
									<button className="receipt-btn">
										<ArrowUpRight size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
