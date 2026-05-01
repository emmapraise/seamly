import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi, customerApi, inventoryApi, storageApi } from '../api';
import { ArrowLeft, Save, Plus, Trash2, Package, Image as ImageIcon, Camera, Loader2, X, Eye, CheckCircle, Info, Calendar } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '../utils/formatters';
import { Modal } from '../components/Modal';

export const OrderCreateScreen = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const preselectedCustomerId = searchParams.get('customerId');
	
	const [clients, setClients] = useState<any[]>([]);
	const [inventory, setInventory] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReview, setShowReview] = useState(false);
	
	const [collectPartPayment, setCollectPartPayment] = useState(false);
	const [images, setImages] = useState<File[]>([]);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const [selectedItems, setSelectedItems] = useState<any[]>([]);
	
	const getTwoWeeksFromNow = () => {
		const date = new Date();
		date.setDate(date.getDate() + 14);
		return date.toISOString().split('T')[0];
	};

	const [formData, setFormData] = useState({
		title: '',
		customerId: preselectedCustomerId || '',
		dueDate: getTwoWeeksFromNow(),
		garmentType: '',
		price: '',
		deposit: '',
		status: 'pending',
		notes: '',
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [clientsRes, inventoryRes] = await Promise.all([
				customerApi.getAll(),
				inventoryApi.getAll()
			]);
			setClients(clientsRes.data);
			setInventory(inventoryRes.data);
		} catch (error) {
			console.error('Failed to load data', error);
		} finally {
			setLoading(false);
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files);
			setImages([...images, ...filesArray]);
			
			const previews = filesArray.map(file => URL.createObjectURL(file));
			setImageUrls([...imageUrls, ...previews]);
		}
	};

	const removeImage = (index: number) => {
		const newImages = [...images];
		const newUrls = [...imageUrls];
		newImages.splice(index, 1);
		newUrls.splice(index, 1);
		setImages(newImages);
		setImageUrls(newUrls);
	};

	const addItem = (itemId: string) => {
		const item = inventory.find(i => i.id === itemId);
		if (!item) return;
		if (selectedItems.find(i => i.id === itemId)) return;
		setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
	};

	const updateItemQty = (index: number, qty: number) => {
		const newItems = [...selectedItems];
		newItems[index].quantity = qty;
		setSelectedItems(newItems);
	};

	const removeItem = (index: number) => {
		const newItems = [...selectedItems];
		newItems.splice(index, 1);
		setSelectedItems(newItems);
	};

	const handleReview = (e: React.FormEvent) => {
		e.preventDefault();
		const totalPrice = parseFormattedNumber(formData.price);
		const depositAmount = collectPartPayment ? parseFormattedNumber(formData.deposit) : 0;
		
		if (collectPartPayment && depositAmount >= totalPrice) {
			alert('Deposit must be less than the total price');
			return;
		}

		for (const item of selectedItems) {
			if (item.isDeductible !== false && item.quantity > (item.qtyOnHand || item.quantity)) {
				alert(`Not enough stock for ${item.itemName}. Available: ${item.qtyOnHand || 0}`);
				return;
			}
		}

		setShowReview(true);
	};

	const handleSubmit = async () => {
		const totalPrice = parseFormattedNumber(formData.price);
		const depositAmount = collectPartPayment ? parseFormattedNumber(formData.deposit) : 0;

		setIsSubmitting(true);
		try {
			const uploadedUrls: string[] = [];
			if (images.length > 0) {
				setIsUploading(true);
				for (const file of images) {
					const url = await storageApi.uploadImage(file);
					uploadedUrls.push(url);
				}
				setIsUploading(false);
			}

			const orderData = {
				...formData,
				customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Walking Client',
				price: totalPrice,
				deposit: depositAmount,
				balance: totalPrice - depositAmount,
				imageUrls: uploadedUrls,
				items: selectedItems.map(i => ({ 
					id: i.id, 
					name: i.itemName || i.name, 
					quantity: i.quantity,
					unit: i.unit 
				})),
				createdAt: new Date().toISOString(),
			};

			await orderApi.create(orderData);

			for (const item of selectedItems) {
				if (item.isDeductible !== false) {
					try {
						await inventoryApi.deduct(item.id, item.quantity);
					} catch (deductError) {
						console.warn(`Failed to deduct stock for ${item.itemName || item.name}:`, deductError);
					}
				}
			}

			navigate('/orders');
		} catch (error: any) {
			console.error('Order creation failed:', error);
			alert(`Error: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) return <div className="loader"></div>;

	const selectedCustomer = clients.find(c => c.id === formData.customerId);

	return (
		<div className="order-create-screen">
			<div className="detail-header-row">
				<button className="back-button" onClick={() => navigate(-1)}>
					<ArrowLeft size={20} /> Back to Dashboard
				</button>
				<button type="submit" form="order-create-form" className="primary-btn" style={{ width: 'auto' }}>
					<Eye size={18} /> Review & Finalize
				</button>
			</div>

			<header style={{ marginBottom: '2.5rem' }}>
				<h1 className="text-gradient">Create Production Order</h1>
				<p>Configure garment details, materials, and pricing</p>
			</header>

			<form id="order-create-form" className="production-form-layout" onSubmit={handleReview}>
				<div className="form-column">
					<div className="card luxury-form-card">
						<h3 className="section-title">Client & Job Info</h3>
						<div className="input-group">
							<label>Select Client</label>
							<select
								value={formData.customerId}
								onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
								required
								disabled={!!preselectedCustomerId}
							>
								<option value="">Choose a client...</option>
								{clients.map(client => (
									<option key={client.id} value={client.id}>
										{client.firstName} {client.lastName}
									</option>
								))}
							</select>
						</div>
						
						<div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '1.25rem' }}>
							<div className="input-group">
								<label>Garment Type</label>
								<select
									value={formData.garmentType}
									onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
									required
								>
									<option value="">Select type...</option>
									<option value="Suit (2-piece)">Suit (2-piece)</option>
									<option value="Suit (3-piece)">Suit (3-piece)</option>
									<option value="Kaftan">Kaftan</option>
									<option value="Agbada">Agbada</option>
									<option value="Shirt">Shirt</option>
									<option value="Trousers">Trousers</option>
									<option value="Dress">Dress</option>
									<option value="Native/Traditional">Native/Traditional</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<div className="input-group">
								<label>Delivery Date</label>
								<input
									type="date"
									value={formData.dueDate}
									onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className="input-group" style={{ marginTop: '1.25rem' }}>
							<label>Order Title / Style Description</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								placeholder="e.g. Navy Blue 3-Piece Wedding Suit"
								required
							/>
						</div>
					</div>

					<div className="card luxury-form-card" style={{ marginTop: '1.5rem' }}>
						<h3 className="section-title">Pricing & Payments</h3>
						<div className="grid grid-cols-2" style={{ gap: '1rem' }}>
							<div className="input-group">
								<label>Total Price (₦)</label>
								<input
									type="text"
									value={formatNumber(formData.price)}
									onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/,/g, '') })}
									placeholder="0.00"
									required
								/>
							</div>
							<div className="input-group">
								<label style={{ opacity: 0 }}>Deposit</label>
								<div className="flex items-center gap-2" style={{ height: '50px' }}>
									<input 
										type="checkbox" 
										checked={collectPartPayment} 
										onChange={(e) => setCollectPartPayment(e.target.checked)}
										style={{ width: 'auto', margin: 0 }}
									/>
									<span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Collect Deposit</span>
								</div>
							</div>
						</div>

						{collectPartPayment && (
							<div className="input-group highlight-input" style={{ marginTop: '1.25rem' }}>
								<label>Deposit Amount (₦)</label>
								<input
									type="text"
									value={formatNumber(formData.deposit)}
									onChange={(e) => setFormData({ ...formData, deposit: e.target.value.replace(/,/g, '') })}
									placeholder="Enter deposit"
									required
								/>
								<div className="balance-preview">
									Remaining Balance: ₦{(parseFormattedNumber(formData.price) - parseFormattedNumber(formData.deposit || '0')).toLocaleString()}
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="form-column">
					<div className="card luxury-form-card">
						<h3 className="section-title">Style References</h3>
						<div className="image-uploader-grid">
							{imageUrls.map((url, index) => (
								<div key={index} className="image-upload-box">
									<img src={url} alt="" />
									<button type="button" className="remove-btn" onClick={() => removeImage(index)}><X size={14} /></button>
								</div>
							))}
							<label className="image-add-box">
								<input type="file" multiple accept="image/*" onChange={handleImageChange} hidden />
								<Camera size={24} />
								<span>Add Photo</span>
							</label>
						</div>
					</div>

					<div className="card luxury-form-card" style={{ marginTop: '1.5rem' }}>
						<h3 className="section-title">Material Usage</h3>
						<div className="input-group">
							<select onChange={(e) => { if (e.target.value) addItem(e.target.value); e.target.value = ''; }}>
								<option value="">Select inventory item...</option>
								{inventory.map(item => (
									<option key={item.id} value={item.id} disabled={item.qtyOnHand <= 0 && item.isDeductible !== false}>
										{item.itemName} ({item.qtyOnHand || 0} {item.unit})
									</option>
								))}
							</select>
						</div>
						<div className="selected-materials-list">
							{selectedItems.map((item, index) => (
								<div key={item.id} className="material-item-row">
									<div className="material-info">
										<span className="name">{item.itemName}</span>
										<span className="stock">{item.unit}</span>
									</div>
									<div className="material-actions">
										{item.isDeductible !== false && (
											<input 
												type="number" 
												value={item.quantity} 
												onChange={(e) => updateItemQty(index, parseFloat(e.target.value) || 0)}
												min="0.1"
												step="0.1"
											/>
										)}
										<button type="button" onClick={() => removeItem(index)}><X size={14} /></button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="card luxury-form-card" style={{ marginTop: '1.5rem' }}>
						<h3 className="section-title">Production Notes</h3>
						<textarea
							value={formData.notes}
							onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							placeholder="Specific style requests or tailoring notes..."
							rows={4}
						/>
					</div>
				</div>
			</form>

			<Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Final Review">
				<div className="order-review-luxury">
					<div className="review-section">
						<div className="flex-between">
							<div className="flex items-center gap-3">
								<div className="review-avatar">
									<img src={selectedCustomer?.profilePicture || `https://ui-avatars.com/api/?name=${selectedCustomer?.firstName}+${selectedCustomer?.lastName}`} alt="" />
								</div>
								<div>
									<div className="review-customer-name">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</div>
									<div className="review-customer-phone">{selectedCustomer?.phone}</div>
								</div>
							</div>
							<div className="review-garment-tag">{formData.garmentType}</div>
						</div>
					</div>

					<div className="review-details-grid">
						<div className="review-card">
							<span className="label">Total Price</span>
							<span className="value">₦{parseFormattedNumber(formData.price).toLocaleString()}</span>
						</div>
						<div className="review-card">
							<span className="label">Deposit Paid</span>
							<span className="value success">₦{parseFormattedNumber(formData.deposit || '0').toLocaleString()}</span>
						</div>
					</div>

					<div className="review-info-row">
						<div className="review-info-item">
							<Calendar size={16} />
							<span>Delivering on <strong>{new Date(formData.dueDate).toLocaleDateString()}</strong></span>
						</div>
					</div>

					<div className="review-footer-actions">
						<button className="secondary-btn" onClick={() => setShowReview(false)}>Edit Order</button>
						<button className="primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Create Order</>}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

