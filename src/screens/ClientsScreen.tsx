import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, measurementApi, storageApi } from '../api';
import { Plus, User, Phone, Mail, ChevronRight, MessageSquare, Camera, Loader2, Ruler, MapPin, Search } from 'lucide-react';
import { Modal } from '../components/Modal';
import { formatNumber, parseFormattedNumber } from '../utils/formatters';

export const ClientsScreen = () => {
	const navigate = useNavigate();
	const [clients, setClients] = useState<any[]>([]);
	const [filteredClients, setFilteredClients] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		location: '',
	});

	const [profileImage, setProfileImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string>('');
	const [isUploading, setIsUploading] = useState(false);

	const [gender, setGender] = useState<'Male' | 'Female'>('Female');
	const [measurements, setMeasurements] = useState<Record<string, string>>({});

	useEffect(() => {
		loadClients();
	}, []);

	useEffect(() => {
		const filtered = clients.filter(c => 
			`${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.phone?.includes(searchQuery)
		);
		setFilteredClients(filtered);
	}, [searchQuery, clients]);

	const loadClients = async () => {
		try {
			const res = await customerApi.getAll();
			setClients(res.data);
			setFilteredClients(res.data);
		} catch (error) {
			console.error('Failed to load clients', error);
		} finally {
			setLoading(false);
		}
	};

	const maleFields = [
		{ label: 'Neck', key: 'neck' },
		{ label: 'Shoulder', key: 'shoulder' },
		{ label: 'Chest', key: 'chest' },
		{ label: 'Waist', key: 'waist' },
		{ label: 'Hip', key: 'hip' },
		{ label: 'Sleeve', key: 'sleeve' },
		{ label: 'Length', key: 'trousersLength' },
	];

	const femaleFields = [
		{ label: 'Bust', key: 'bust' },
		{ label: 'Waist', key: 'waist' },
		{ label: 'Hips', key: 'hips' },
		{ label: 'Shoulder', key: 'shoulder' },
		{ label: 'Underbust', key: 'underbust' },
		{ label: 'Sleeve', key: 'sleeve' },
		{ label: 'Full Length', key: 'fullLength' },
	];

	const currentFields = gender === 'Male' ? maleFields : femaleFields;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setProfileImage(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleAddClient = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			let profilePictureUrl = '';
			if (profileImage) {
				setIsUploading(true);
				profilePictureUrl = await storageApi.uploadImage(profileImage);
				setIsUploading(false);
			}

			const customerRes = await customerApi.create({
				...formData,
				gender: gender === 'Male' ? 'MALE' : 'FEMALE',
				profilePicture: profilePictureUrl,
				createdAt: new Date().toISOString(),
			});
			const customerId = customerRes.data.id;

			const measurementData: Record<string, number> = {};
			Object.entries(measurements).forEach(([key, val]) => {
				const num = parseFormattedNumber(val);
				if (num > 0) measurementData[key] = num;
			});

			if (Object.keys(measurementData).length > 0) {
				await measurementApi.create({
					customerId,
					label: 'Initial Measurement',
					data: measurementData,
					isDefault: true,
					createdAt: new Date().toISOString(),
				});
			}

			setIsModalOpen(false);
			resetForm();
			loadClients();
		} catch (error) {
			console.error('Failed to add client', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({ firstName: '', lastName: '', email: '', phone: '', location: '' });
		setMeasurements({});
		setProfileImage(null);
		setPreviewUrl('');
	};

	if (loading) return <div className="loader"></div>;

	return (
		<div className="clients-screen">
			<header className="flex-between" style={{ marginBottom: '2.5rem' }}>
				<div>
					<h1 className="text-gradient">Clients</h1>
					<p>Search and manage your customer profiles</p>
				</div>
				<button className="primary-btn" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
					<Plus size={20} /> Add New Client
				</button>
			</header>

			<div className="search-container">
				<Search className="search-icon" size={20} />
				<input 
					type="text" 
					className="search-input" 
					placeholder="Search by name or phone..." 
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<Modal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				title="Add New Client"
			>
				<form onSubmit={handleAddClient} className="dynamic-form">
					<div className="form-section">
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
								<span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{previewUrl ? 'Change Photo' : 'Add Profile Photo'}</span>
							</label>
						</div>

						<div className="grid grid-cols-2">
							<div className="input-group">
								<label>First Name</label>
								<input
									type="text"
									value={formData.firstName}
									onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
									required
									placeholder="John"
								/>
							</div>
							<div className="input-group">
								<label>Last Name</label>
								<input
									type="text"
									value={formData.lastName}
									onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
									required
									placeholder="Doe"
								/>
							</div>
						</div>
						<div className="grid grid-cols-2">
							<div className="input-group">
								<label><div className="flex items-center gap-1"><Phone size={14} /> Phone</div></label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
									required
									placeholder="+234..."
								/>
							</div>
							<div className="input-group">
								<label><div className="flex items-center gap-1"><Mail size={14} /> Email</div></label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									placeholder="Optional"
								/>
							</div>
						</div>
						<div className="input-group">
							<label><div className="flex items-center gap-1"><MapPin size={14} /> Location</div></label>
							<input
								type="text"
								value={formData.location}
								onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								placeholder="Client's Address"
							/>
						</div>
					</div>

					<div className="form-section">
						<div className="flex items-center gap-2 mb-4">
							<Ruler size={18} color="var(--primary-color)" />
							<h4 className="section-title m-0">Initial Measurements</h4>
						</div>

						<div className="gender-selector-premium">
							<button 
								type="button" 
								className={`gender-btn ${gender === 'Male' ? 'active' : ''}`}
								onClick={() => setGender('Male')}
							>
								Male
							</button>
							<button 
								type="button" 
								className={`gender-btn ${gender === 'Female' ? 'active' : ''}`}
								onClick={() => setGender('Female')}
							>
								Female
							</button>
						</div>

						<div className="measurements-input-grid">
							{currentFields.map(field => (
								<div key={field.key} className="measurement-input-box">
									<label>{field.label}</label>
									<input
										type="text"
										placeholder="0.0"
										value={formatNumber(measurements[field.key] || '')}
										onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value.replace(/,/g, '') })}
									/>
									<span className="unit-label">in</span>
								</div>
							))}
						</div>
					</div>

					<div style={{ marginTop: '2rem' }}>
						<button type="submit" disabled={isSubmitting || isUploading} className="primary-btn">
							{isSubmitting ? (
								<><Loader2 className="animate-spin" size={20} /> {isUploading ? 'Uploading Image...' : 'Saving Profile...'}</>
							) : (
								'Create Client Profile'
							)}
						</button>
					</div>
				</form>
			</Modal>

			{filteredClients.length === 0 ? (
				<div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
					<User size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', opacity: 0.3 }} />
					<h3 style={{ fontSize: '1.25rem' }}>{searchQuery ? 'No results found' : 'No Clients Yet'}</h3>
					<p style={{ opacity: 0.6 }}>{searchQuery ? 'Try searching for a different name or number' : 'Start by adding your first client to keep track of their details.'}</p>
				</div>
			) : (
				<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
					{filteredClients.map((client) => (
						<div 
							key={client.id} 
							onClick={() => navigate(`/clients/${client.id}`)} 
							className="card client-grid-card"
							style={{ cursor: 'pointer' }}
						>
							<div className="flex-between" style={{ marginBottom: '1.5rem' }}>
								<div className="client-avatar-container">
									<div className="card-icon" style={{ margin: 0, width: '60px', height: '60px', overflow: 'hidden', borderRadius: '18px' }}>
										<img 
											src={client.profilePicture || `https://ui-avatars.com/api/?name=${client.firstName}+${client.lastName}&background=0F1C3F&color=fff`} 
											alt="Avatar" 
											style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
										/>
									</div>
									<div className="status-dot"></div>
								</div>
								<div className="flex" style={{ gap: '0.75rem' }}>
									<button 
										className="circle-action-btn"
										style={{ width: '40px', height: '40px', color: '#25D366' }}
										onClick={(e) => {
											e.stopPropagation();
											window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank');
										}}
									>
										<MessageSquare size={18} />
									</button>
									<button 
										className="circle-action-btn"
										style={{ width: '40px', height: '40px' }}
									>
										<ChevronRight size={18} />
									</button>
								</div>
							</div>
							
							<div>
								<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>{client.firstName} {client.lastName}</h3>
								<div className="flex" style={{ gap: '1rem', opacity: 0.6, fontSize: '0.85rem' }}>
									<span className="flex items-center gap-1"><Phone size={14} /> {client.phone}</span>
									{client.location && <span className="flex items-center gap-1"><MapPin size={14} /> {client.location}</span>}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
