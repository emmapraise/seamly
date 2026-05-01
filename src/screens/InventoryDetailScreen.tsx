import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api';
import { ArrowLeft, Package, Tag, Hash, Trash2, Edit3, Save, Info, ShoppingCart, Truck, AlertTriangle } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '../utils/formatters';

export const InventoryDetailScreen = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [item, setItem] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<any>(null);

	useEffect(() => {
		if (id) fetchItemData();
	}, [id]);

	const fetchItemData = async () => {
		try {
			setLoading(true);
			const res = await inventoryApi.getOne(id!);
			setItem(res.data);
			setFormData(res.data);
		} catch (error) {
			console.error('Failed to fetch item data', error);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const updateData = {
				...formData,
				qtyOnHand: parseFormattedNumber(formData.qtyOnHand?.toString() || formData.quantity?.toString()),
				costPerUnit: parseFormattedNumber(formData.costPerUnit?.toString() || formData.costPrice?.toString()),
				lowStockThreshold: parseFormattedNumber(formData.lowStockThreshold?.toString() || formData.reorderLevel?.toString()),
			};
			await inventoryApi.update(id!, updateData);
			setItem({ ...item, ...updateData });
			setIsEditing(false);
		} catch (error) {
			console.error('Failed to update item', error);
		}
	};

	const handleDelete = async () => {
		if (window.confirm('Are you sure you want to delete this item?')) {
			try {
				await inventoryApi.delete(id!);
				navigate('/inventory');
			} catch (error) {
				console.error('Failed to delete item', error);
			}
		}
	};

	if (loading) return <div className="loader"></div>;
	if (!item) return <div>Item not found</div>;

	const itemName = item.itemName || item.name;
	const qtyOnHand = item.qtyOnHand !== undefined ? item.qtyOnHand : item.quantity;
	const costPerUnit = item.costPerUnit !== undefined ? item.costPerUnit : item.costPrice;
	const lowStockThreshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : (item.reorderLevel || 5);
	const isLowStock = qtyOnHand < lowStockThreshold;

	return (
		<div className="inventory-detail-screen">
			<div className="detail-header-row">
				<button className="back-button" onClick={() => navigate('/inventory')}>
					<ArrowLeft size={20} /> Back to Inventory
				</button>
				<div className="flex gap-3">
					<button 
						className="secondary" 
						style={{ width: 'auto' }}
						onClick={() => setIsEditing(!isEditing)}
					>
						{isEditing ? <ArrowLeft size={18} /> : <Edit3 size={18} />}
						{isEditing ? 'Cancel Edit' : 'Edit Item'}
					</button>
					{!isEditing && (
						<button 
							className="secondary" 
							style={{ width: 'auto', color: 'var(--danger-color)' }}
							onClick={handleDelete}
						>
							<Trash2 size={18} /> Delete
						</button>
					)}
				</div>
			</div>

			<div className="detail-hero-section">
				<div className="flex items-center gap-6">
					<div className="card-icon inventory-icon" style={{ width: '80px', height: '80px', borderRadius: '24px' }}>
						<Package size={36} />
					</div>
					<div>
						<h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>{itemName}</h1>
						<div className="flex items-center gap-3">
							<span className="status-badge" style={{ background: 'var(--primary-color)', color: 'white' }}>{item.category}</span>
							<span style={{ opacity: 0.5, fontSize: '0.9rem' }}>SKU: {item.sku || 'No SKU'}</span>
						</div>
					</div>
				</div>
			</div>

			{isEditing ? (
				<form onSubmit={handleUpdate} className="card" style={{ padding: '2.5rem', marginTop: '2rem' }}>
					<h3 className="section-title">Edit Inventory Item</h3>
					<div className="grid grid-cols-2">
						<div className="input-group">
							<label>Item Name</label>
							<input 
								type="text" 
								value={formData.itemName || formData.name || ''} 
								onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
								required
							/>
						</div>
						<div className="input-group">
							<label>Category</label>
							<select
								value={formData.category}
								onChange={(e) => setFormData({ ...formData, category: e.target.value })}
								required
							>
								<option value="Fabrics">Fabrics</option>
								<option value="Notions">Notions</option>
								<option value="Work-in-Progress">Work-in-Progress</option>
								<option value="Finished Products">Finished Products</option>
								<option value="Tools & Equipment">Tools & Equipment</option>
								<option value="Packaging & Accessories">Packaging & Accessories</option>
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2">
						<div className="input-group">
							<label>Quantity</label>
							<input 
								type="text" 
								value={formatNumber(formData.qtyOnHand !== undefined ? formData.qtyOnHand : formData.quantity)} 
								onChange={(e) => setFormData({ ...formData, qtyOnHand: e.target.value.replace(/,/g, '') })}
								required
							/>
						</div>
						<div className="input-group">
							<label>Unit</label>
							<select
								value={formData.unit}
								onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
								required
							>
								<option value="yards">Yards</option>
								<option value="meters">Meters</option>
								<option value="pcs">Pieces (pcs)</option>
								<option value="rolls">Rolls</option>
								<option value="sets">Sets</option>
								<option value="kg">Kilograms (kg)</option>
							</select>
						</div>
					</div>

					<button type="submit" className="primary-btn" style={{ marginTop: '1.5rem', width: 'auto' }}>
						<Save size={18} /> Update Stock Info
					</button>
				</form>
			) : (
				<div className="grid grid-cols-3" style={{ gap: '2rem', marginTop: '2.5rem' }}>
					<div className="card stat-card-luxury">
						<div className="flex-between">
							<div className="icon-box" style={{ background: isLowStock ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)' }}>
								{isLowStock ? <AlertTriangle color="var(--danger-color)" /> : <Hash color="var(--success-color)" />}
							</div>
							<span className="label">Available Stock</span>
						</div>
						<div className="value" style={{ color: isLowStock ? 'var(--danger-color)' : 'inherit' }}>
							{qtyOnHand.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.5 }}>{item.unit}</span>
						</div>
						<p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
							Threshold: {lowStockThreshold} {item.unit}
						</p>
					</div>

					<div className="card stat-card-luxury">
						<div className="flex-between">
							<div className="icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
								<ShoppingCart color="#3b82f6" />
							</div>
							<span className="label">Unit Cost</span>
						</div>
						<div className="value">
							₦{costPerUnit.toLocaleString()}
						</div>
						<p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
							Total Asset: ₦{(qtyOnHand * costPerUnit).toLocaleString()}
						</p>
					</div>

					<div className="card stat-card-luxury">
						<div className="flex-between">
							<div className="icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
								<Truck color="#8b5cf6" />
							</div>
							<span className="label">Stock Logistics</span>
						</div>
						<div className="value" style={{ fontSize: '1.25rem' }}>
							{item.supplier || 'No Supplier'}
						</div>
						<p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
							{item.isDeductible !== false ? 'Auto-deduct enabled' : 'Manual tracking only'}
						</p>
					</div>
				</div>
			)}
		</div>
	);
};


