import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api';
import { Package, Plus, ChevronRight, Search, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Modal } from '../components/Modal';
import { formatNumber, parseFormattedNumber } from '../utils/formatters';

export const InventoryScreen = () => {
	const [items, setItems] = useState<any[]>([]);
	const [filteredItems, setFilteredItems] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	const [stats, setStats] = useState({
		totalItems: 0,
		lowStock: 0,
		totalValue: 0
	});

	const [formData, setFormData] = useState({
		name: '',
		category: '',
		quantity: '',
		unit: 'meters',
		sku: '',
		costPrice: '',
		supplier: '',
		fabricType: '',
		color: '',
		pattern: '',
		width: '',
		notionType: '',
		size: '',
		reorderLevel: '',
		isDeductible: true,
	});

	const categories = [
		'Fabrics',
		'Notions',
		'Work-in-Progress',
		'Finished Products',
		'Tools & Equipment',
		'Packaging & Accessories'
	];

	useEffect(() => {
		loadInventory();
	}, []);

	useEffect(() => {
		const filtered = items.filter(item => {
			const name = (item.itemName || item.name || '').toLowerCase();
			return name.includes(searchQuery.toLowerCase()) || 
				   (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
		});
		setFilteredItems(filtered);
	}, [searchQuery, items]);

	const loadInventory = async () => {
		try {
			const res = await inventoryApi.getAll();
			const allItems = res.data;
			setItems(allItems);
			setFilteredItems(allItems);

			// Calculate Stats
			let totalVal = 0;
			let lowCount = 0;
			allItems.forEach((item: any) => {
				const qty = parseFloat(item.qtyOnHand || item.quantity || 0);
				const cost = parseFloat(item.costPrice || 0);
				const reorder = parseFloat(item.reorderLevel || item.lowStockThreshold || 5);
				
				totalVal += (qty * cost);
				if (qty < reorder) lowCount++;
			});

			setStats({
				totalItems: allItems.length,
				lowStock: lowCount,
				totalValue: totalVal
			});

		} catch (error) {
			console.error('Failed to load inventory', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddItem = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await inventoryApi.create({
				...formData,
				quantity: parseFormattedNumber(formData.quantity),
				costPrice: parseFormattedNumber(formData.costPrice),
				reorderLevel: parseFormattedNumber(formData.reorderLevel),
				createdAt: new Date().toISOString(),
			});
			setIsModalOpen(false);
			resetForm();
			loadInventory();
		} catch (error) {
			console.error('Failed to add item', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({
			name: '', category: '', quantity: '', unit: 'meters',
			sku: '', costPrice: '', supplier: '',
			fabricType: '', color: '', pattern: '', width: '',
			notionType: '', size: '', reorderLevel: '',
			isDeductible: true,
		});
	};

	const getStockStatus = (qty: number, reorder: number) => {
		if (qty === 0) return 'critical';
		if (qty < reorder) return 'warning';
		return 'healthy';
	};

	if (loading) return <div className="loader"></div>;

	return (
		<div className="inventory-screen">
			<header className="flex-between" style={{ marginBottom: '2.5rem' }}>
				<div>
					<h1 className="text-gradient">Inventory</h1>
					<p>Track your materials and equipment stock</p>
				</div>
				<button className="primary-btn" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
					<Plus size={20} /> Add New Item
				</button>
			</header>

			<div className="inventory-summary-grid">
				<div className="card mini-stat-card">
					<span className="label">Total Items</span>
					<div className="value">{stats.totalItems}</div>
					<div className="trend"><TrendingUp size={12} /> Unique products</div>
				</div>
				<div className="card mini-stat-card">
					<span className="label">Low Stock</span>
					<div className="value" style={{ color: stats.lowStock > 0 ? 'var(--danger-color)' : 'inherit' }}>
						{stats.lowStock}
					</div>
					<div className="trend"><AlertCircle size={12} /> Needs attention</div>
				</div>
				<div className="card mini-stat-card">
					<span className="label">Inventory Value</span>
					<div className="value">₦{stats.totalValue.toLocaleString()}</div>
					<div className="trend"><DollarSign size={12} /> Est. cost value</div>
				</div>
			</div>

			<div className="search-container">
				<Search className="search-icon" size={20} />
				<input 
					type="text" 
					className="search-input" 
					placeholder="Search materials, fabrics, notions..." 
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<Modal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				title="Add Inventory Item"
			>
				<form onSubmit={handleAddItem} className="dynamic-form">
					<div className="form-section">
						<h4 className="section-title">General Information</h4>
						<div className="grid grid-cols-2">
							<div className="input-group">
								<label>Item Name</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									required
									placeholder="e.g. Blue Cotton"
								/>
							</div>
							<div className="input-group">
								<label>Category</label>
								<select
									value={formData.category}
									onChange={(e) => setFormData({ ...formData, category: e.target.value })}
									required
								>
									<option value="">Select Category</option>
									{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2">
							<div className="input-group">
								<label>SKU / ID <small>(Optional)</small></label>
								<input
									type="text"
									value={formData.sku}
									onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
									placeholder="ARC-001"
								/>
							</div>
							<div className="input-group">
								<label>Supplier</label>
								<input
									type="text"
									value={formData.supplier}
									onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
									placeholder="Supplier Name"
								/>
							</div>
						</div>
					</div>

					<div className="form-section">
						<h4 className="section-title">Stock & Pricing</h4>
						<div className="grid grid-cols-2">
							<div className="input-group">
								<label>Quantity</label>
								<input
									type="text"
									value={formatNumber(formData.quantity)}
									onChange={(e) => setFormData({ ...formData, quantity: e.target.value.replace(/,/g, '') })}
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

						<div className="grid grid-cols-2">
							<div className="input-group">
								<label>Cost Price (₦)</label>
								<input
									type="text"
									value={formatNumber(formData.costPrice)}
									onChange={(e) => setFormData({ ...formData, costPrice: e.target.value.replace(/,/g, '') })}
									placeholder="0.00"
								/>
							</div>
							<div className="input-group">
								<label>Reorder Level</label>
								<input
									type="text"
									value={formatNumber(formData.reorderLevel)}
									onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value.replace(/,/g, '') })}
									placeholder="Notify at..."
								/>
							</div>
						</div>

						<div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px', marginTop: '1rem' }}>
							<input 
								type="checkbox" 
								checked={formData.isDeductible} 
								onChange={(e) => setFormData({ ...formData, isDeductible: e.target.checked })}
								style={{ width: 'auto', margin: 0 }}
							/>
							<div>
								<div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Automatically deduct from stock?</div>
								<div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Uncheck for tools or equipment.</div>
							</div>
						</div>
					</div>

					<div style={{ marginTop: '2rem' }}>
						<button type="submit" disabled={isSubmitting} className="primary-btn">
							{isSubmitting ? 'Adding to Inventory...' : 'Add to Inventory'}
						</button>
					</div>
				</form>
			</Modal>

			{filteredItems.length === 0 ? (
				<div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
					<Package size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', opacity: 0.3 }} />
					<h3 style={{ fontSize: '1.25rem' }}>{searchQuery ? 'No results found' : 'Empty Inventory'}</h3>
					<p style={{ opacity: 0.6 }}>{searchQuery ? 'Try a different search term' : 'Add fabrics, threads, and other materials to track your stock.'}</p>
				</div>
			) : (
				<div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
					{filteredItems.map((item) => {
						const name = item.itemName || item.name;
						const qty = parseFloat(item.qtyOnHand || item.quantity || 0);
						const unit = item.unit || 'meters';
						const reorder = parseFloat(item.reorderLevel || item.lowStockThreshold || 5);
						const status = getStockStatus(qty, reorder);
						const percentage = Math.min((qty / (reorder * 3)) * 100, 100);

						return (
							<Link 
								key={item.id} 
								to={`/inventory/${item.id}`}
								className="card inventory-card"
								style={{ textDecoration: 'none', color: 'inherit' }}
							>
								<div className="flex-between">
									<div className="flex" style={{ gap: '1rem' }}>
										<div className="card-icon inventory-icon" style={{ margin: 0, width: '48px', height: '48px', borderRadius: '14px' }}>
											<Package size={22} />
										</div>
										<div>
											<h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{name}</h3>
											<p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>{item.category}</p>
										</div>
									</div>
									<div style={{ textAlign: 'right' }}>
										<div style={{ fontWeight: 800, fontSize: '1.1rem', color: status === 'critical' ? 'var(--danger-color)' : 'inherit' }}>
											{qty.toLocaleString()} <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{unit}</span>
										</div>
										<div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6 }}>
											Stock Level
										</div>
									</div>
								</div>
								
								<div className="stock-progress-container">
									<div 
										className={`stock-progress-bar ${status}`} 
										style={{ width: `${percentage}%` }}
									></div>
								</div>
								
								{status !== 'healthy' && (
									<div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: status === 'critical' ? 'var(--danger-color)' : '#f39c12', fontSize: '0.75rem', fontWeight: 700 }}>
										<AlertCircle size={12} />
										{status === 'critical' ? 'Out of Stock' : 'Low Stock Alert'}
									</div>
								)}
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
};
