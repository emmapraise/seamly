import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, measurementApi, orderApi, storageApi } from '../api';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Ruler, 
  ShoppingBag, 
  Plus, 
  ChevronRight, 
  MessageSquare,
  ArrowLeft,
  Edit3,
  Camera,
  Loader2,
  Calendar,
  Activity,
  CreditCard
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const CustomerProfileScreen = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('Overview');
	const [customer, setCustomer] = useState<any>(null);
	const [measurements, setMeasurements] = useState<any[]>([]);
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editData, setEditData] = useState<any>({});
	const [profileImage, setProfileImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string>('');

	useEffect(() => {
		if (id) fetchCustomerData();
	}, [id]);

	const fetchCustomerData = async () => {
		try {
			setLoading(true);
			const [custRes, measRes, ordersRes] = await Promise.all([
				customerApi.getOne(id!),
				measurementApi.getByCustomer(id!),
				orderApi.getByCustomer(id!),
			]);
			setCustomer(custRes.data);
			setEditData(custRes.data);
			setPreviewUrl(custRes.data.profilePicture || '');
			setMeasurements(measRes.data);
			setOrders(ordersRes.data);
		} catch (error) {
			console.error('Failed to fetch customer data', error);
		} finally {
			setLoading(false);
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setProfileImage(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			let profilePictureUrl = customer.profilePicture;
			if (profileImage) {
				profilePictureUrl = await storageApi.uploadImage(profileImage);
			}

			const updatedData = {
				...editData,
				profilePicture: profilePictureUrl,
			};

			await customerApi.update(id!, updatedData);
			setCustomer(updatedData);
			setIsEditModalOpen(false);
			setProfileImage(null);
		} catch (error) {
			console.error('Failed to update customer', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleWhatsApp = () => {
		if (customer?.phone) {
			const message = `Hello ${customer.firstName}, this is Arcseams regarding your tailoring order...`;
			window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
		}
	};

	const handleEmail = () => {
		if (customer?.email) {
			const subject = 'Regarding your tailoring order - Arcseams';
			const body = `Hello ${customer.firstName},`;
			window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		}
	};

	if (loading) return <div className="loader"></div>;
	if (!customer) return <div>Customer not found</div>;

	return (
		<div className="customer-profile-screen">
			<div className="detail-header-row">
				<button className="back-button" onClick={() => navigate('/clients')}>
					<ArrowLeft size={20} /> Back to Clients
				</button>
				<button className="secondary" style={{ width: 'auto' }} onClick={() => setIsEditModalOpen(true)}>
					<Edit3 size={18} /> Edit Profile
				</button>
			</div>

			<section className="card profile-hero-card">
				<div className="profile-hero-cover"></div>
				<div className="profile-hero-content">
					<div className="profile-hero-left">
						<div className="profile-avatar-xl">
							<img 
								src={customer.profilePicture || `https://ui-avatars.com/api/?name=${customer.firstName}+${customer.lastName}&background=0F1C3F&color=fff`} 
								alt="Profile" 
							/>
						</div>
						<div className="profile-hero-details">
							<div className="flex items-center gap-3">
								<h1>{customer.firstName} {customer.lastName}</h1>
								{customer.isVip && <span className="status-pill ready" style={{ fontSize: '0.6rem' }}>VIP Client</span>}
							</div>
							<div className="profile-hero-meta">
								<span className="flex items-center gap-1"><Phone size={14} /> {customer.phone}</span>
								{customer.email && <span className="flex items-center gap-1"><Mail size={14} /> {customer.email}</span>}
								<span className="flex items-center gap-1"><MapPin size={14} /> {customer.location || 'Lagos'}</span>
							</div>
						</div>
					</div>
					<div className="profile-hero-actions">
						<button className="circle-action-btn" onClick={handleWhatsApp} style={{ color: '#25D366' }} title="WhatsApp">
							<MessageSquare size={22} />
						</button>
						<button className="circle-action-btn" onClick={handleEmail} title="Email">
							<Mail size={22} />
						</button>
						<button className="primary-btn" style={{ width: 'auto' }} onClick={() => navigate(`/orders/new?customerId=${id}`)}>
							<Plus size={20} /> New Order
						</button>
					</div>
				</div>
			</section>

			{/* Financial Summary Card */}
			<div className="card balance-summary-card">
				<div className="balance-info">
					<div className="balance-stat">
						<span className="label">Total Orders</span>
						<span className="value">{orders.length}</span>
					</div>
					<div className="divider-v"></div>
					<div className="balance-stat">
						<span className="label">Outstanding Balance</span>
						<span className="value danger">
							₦{orders.reduce((acc, o) => acc + parseFloat((o.balance || (o.price - (o.deposit || 0))).toString().replace(/,/g, '')), 0).toLocaleString()}
						</span>
					</div>
				</div>
				<button 
					className="checkout-trigger-btn"
					onClick={() => navigate(`/checkout?customerId=${id}`)}
					disabled={orders.filter(o => (o.balance || (o.price - (o.deposit || 0))) > 0).length === 0}
				>
					<CreditCard size={18} /> Settle Outstanding
				</button>
			</div>

			<div className="tabs-luxury">
				{['Overview', 'Measurements', 'Orders'].map(tab => (
					<button 
						key={tab}
						className={`tab-luxury-btn ${activeTab === tab ? 'active' : ''}`}
						onClick={() => setActiveTab(tab)}
					>
						{tab}
					</button>
				))}
			</div>

			<div className="tab-body">
				{activeTab === 'Overview' && (
					<div className="overview-tab grid grid-cols-2" style={{ gap: '2.5rem' }}>
						<div className="section-group">
							<h3 className="group-title"><Activity size={18} /> Recent Activity</h3>
							<div className="card" style={{ padding: '0.5rem' }}>
								{orders.slice(0, 3).map(order => (
									<div key={order.id} className="flex-between" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
										<div>
											<div style={{ fontWeight: 700 }}>{order.title || order.garmentType}</div>
											<div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
										</div>
										<span className={`status-pill ${order.status?.toLowerCase()}`}>{order.status}</span>
									</div>
								))}
								{orders.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No recent activity.</p>}
							</div>
						</div>
						<div className="section-group">
							<h3 className="group-title"><Ruler size={18} /> Quick Measurements</h3>
							<div className="card" style={{ padding: '1.5rem' }}>
								<div className="grid grid-cols-2" style={{ gap: '1rem' }}>
									{Object.entries(measurements[0]?.data || {}).slice(0, 4).map(([key, val]) => (
										<div key={key} className="flex-between" style={{ padding: '0.75rem', background: 'var(--input-bg)', borderRadius: '12px' }}>
											<span style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'capitalize' }}>{key}</span>
											<span style={{ fontWeight: 800 }}>{val as string}"</span>
										</div>
									))}
								</div>
								<button 
									className="text-btn" 
									style={{ marginTop: '1.5rem', textAlign: 'center', width: '100%' }}
									onClick={() => setActiveTab('Measurements')}
								>
									View All Measurements <ChevronRight size={14} />
								</button>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'Measurements' && (
					<div className="measurements-tab">
						<div className="flex-between" style={{ marginBottom: '2rem' }}>
							<h3 className="group-title"><Ruler size={20} /> Full Measurement Set</h3>
							<button className="primary-btn" style={{ width: 'auto' }} onClick={() => navigate(`/clients/${id}/measurements/edit`)}>
								<Plus size={18} /> Update Data
							</button>
						</div>
						<div className="measurement-grid-luxury">
							{Object.entries(measurements[0]?.data || {}).map(([key, val]) => (
								<div key={key} className="card m-card-luxury">
									<span className="label">{key.replace(/([A-Z])/g, ' $1')}</span>
									<span className="value">{val as string}"</span>
								</div>
							))}
						</div>
					</div>
				)}

				{activeTab === 'Orders' && (
					<div className="orders-tab">
						<div className="flex-between" style={{ marginBottom: '2rem' }}>
							<h3 className="group-title"><ShoppingBag size={20} /> Client Orders</h3>
							<button className="primary-btn" style={{ width: 'auto' }} onClick={() => navigate(`/orders/new?customerId=${id}`)}>
								<Plus size={18} /> Create New
							</button>
						</div>
						<div className="grid">
							{orders.map(order => (
								<div 
									key={order.id} 
									className="card order-list-item" 
									onClick={() => navigate(`/orders/${order.id}`)}
									style={{ cursor: 'pointer', marginBottom: '1rem' }}
								>
									<div className="order-item-left">
										<div className="order-item-icon"><ShoppingBag size={20} /></div>
										<div>
											<h3 className="order-item-title">{order.title || order.garmentType}</h3>
											<div className="order-item-meta">
												<span>Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'No date'}</span>
											</div>
										</div>
									</div>
									<div className="order-item-right">
										<span className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
										<ChevronRight size={18} className="arrow" />
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<Modal 
				isOpen={isEditModalOpen} 
				onClose={() => setIsEditModalOpen(false)} 
				title="Edit Customer Profile"
			>
				<form onSubmit={handleUpdateProfile} className="dynamic-form">
					<div className="flex-center" style={{ marginBottom: '2rem' }}>
						<label className="profile-upload-label">
							<input type="file" accept="image/*" onChange={handleImageChange} hidden />
							<div className="profile-avatar-upload" style={{ width: '100px', height: '100px', borderRadius: '30px' }}>
								{previewUrl ? (
									<img src={previewUrl} alt="Preview" />
								) : (
									<Camera size={24} style={{ opacity: 0.5 }} />
								)}
							</div>
							<span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Change Photo</span>
						</label>
					</div>

					<div className="grid grid-cols-2">
						<div className="input-group">
							<label>First Name</label>
							<input
								type="text"
								value={editData.firstName}
								onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
								required
							/>
						</div>
						<div className="input-group">
							<label>Last Name</label>
							<input
								type="text"
								value={editData.lastName}
								onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
								required
							/>
						</div>
					</div>
					<div className="input-group">
						<label>Phone Number</label>
						<input
							type="tel"
							value={editData.phone}
							onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
							required
						/>
					</div>
					<div className="input-group">
						<label>Email</label>
						<input
							type="email"
							value={editData.email}
							onChange={(e) => setEditData({ ...editData, email: e.target.value })}
						/>
					</div>
					<div className="input-group">
						<label>Location</label>
						<input
							type="text"
							value={editData.location}
							onChange={(e) => setEditData({ ...editData, location: e.target.value })}
						/>
					</div>

					<div style={{ marginTop: '2.5rem' }}>
						<button type="submit" disabled={isSubmitting} className="primary-btn">
							{isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
						</button>
					</div>
				</form>
			</Modal>
		</div>
	);
};
