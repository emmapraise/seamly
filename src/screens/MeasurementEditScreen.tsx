import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, measurementApi } from '../api';
import { ArrowLeft, Save, Ruler, Loader2 } from 'lucide-react';

const STANDARD_MEASUREMENTS = [
	'Neck', 'Shoulder', 'Chest', 'Bust', 'Waist', 'Hips', 
	'Underbust', 'Armhole', 'Bicep', 'Sleeve Length', 'Wrist', 
	'Full Length', 'Knee Length', 'Inseam', 'Outseam', 'Ankle'
];

export const MeasurementEditScreen = () => {
	const { customerId } = useParams<{ customerId: string }>();
	const navigate = useNavigate();
	const [customer, setCustomer] = useState<any>(null);
	const [measurements, setMeasurements] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (customerId) fetchInitialData();
	}, [customerId]);

	const fetchInitialData = async () => {
		try {
			setLoading(true);
			const [custRes, measRes] = await Promise.all([
				customerApi.getOne(customerId!),
				measurementApi.getByCustomer(customerId!),
			]);
			setCustomer(custRes.data);
			
			if (measRes.data && measRes.data.length > 0) {
				setMeasurements(measRes.data[0].data || {});
			} else {
				const initial: Record<string, string> = {};
				STANDARD_MEASUREMENTS.forEach(m => initial[m] = '');
				setMeasurements(initial);
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const existingMeas = await measurementApi.getByCustomer(customerId!);
			if (existingMeas.data && existingMeas.data.length > 0) {
				await measurementApi.update(existingMeas.data[0].id, {
					data: measurements,
					updatedAt: new Date().toISOString(),
				});
			} else {
				await measurementApi.create({
					customerId,
					label: 'Standard',
					isDefault: true,
					data: measurements,
					createdAt: new Date().toISOString(),
				});
			}
			navigate(`/clients/${customerId}`);
		} catch (error) {
			console.error('Failed to save measurements', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) return <div className="loader"></div>;

	return (
		<div className="measurement-edit-screen">
			<div className="detail-header-row">
				<button className="back-button" onClick={() => navigate(`/clients/${customerId}`)}>
					<ArrowLeft size={20} />
				</button>
				<button 
					className="primary-btn" 
					style={{ width: 'auto' }} 
					form="measurement-form"
					disabled={isSubmitting}
				>
					{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
					Save All Data
				</button>
			</div>

			<header style={{ marginBottom: '2.5rem' }}>
				<h1 className="text-gradient">Precision Measurements</h1>
				<p>Updating technical profile for <strong>{customer?.firstName} {customer?.lastName}</strong></p>
			</header>

			<form id="measurement-form" onSubmit={handleSave}>
				<div className="card" style={{ padding: '2.5rem' }}>
					<div className="flex items-center gap-2 mb-6">
						<Ruler size={20} color="var(--primary-color)" />
						<h3 style={{ margin: 0 }}>Standard Points</h3>
					</div>

					<div className="measurements-input-grid">
						{STANDARD_MEASUREMENTS.map(m => (
							<div key={m} className="measurement-input-box">
								<label>{m}</label>
								<input 
									type="text" 
									value={measurements[m] || ''}
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9.]/g, '');
										setMeasurements({ ...measurements, [m]: val });
									}}
									placeholder="0.0"
								/>
								<span className="unit-label">in</span>
							</div>
						))}
					</div>
				</div>

				<div className="card" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--surface-hover)', borderStyle: 'dashed' }}>
					<h4 style={{ margin: '0 0 1rem 0' }}>Notes & Special Requests</h4>
					<textarea 
						style={{ 
							width: '100%', 
							minHeight: '120px', 
							background: 'var(--surface-color)',
							border: '1px solid var(--border-color)',
							borderRadius: '16px',
							padding: '1.25rem',
							fontSize: '1rem',
							fontFamily: 'inherit'
						}}
						placeholder="e.g. Slant shoulder, preferences for fit, etc."
					></textarea>
				</div>
			</form>
		</div>
	);
};
