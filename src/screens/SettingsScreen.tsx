import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { businessApi } from '../api';
import { 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  LogOut, 
  ChevronRight, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Box,
  Camera,
  Activity,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface SettingItemProps {
	icon: React.ReactNode;
	label: string;
	value?: string;
	onPress?: () => void;
	showChevron?: boolean;
	isSwitch?: boolean;
	switchValue?: boolean;
	onSwitchChange?: (val: boolean) => void;
	color?: string;
}

const SettingItem = ({
	icon,
	label,
	value,
	onPress,
	showChevron = true,
	isSwitch = false,
	switchValue,
	onSwitchChange,
	color,
}: SettingItemProps) => {
	const iconColor = color || 'var(--primary-color)';

	return (
		<div 
			className="setting-item-luxury"
			onClick={!isSwitch ? onPress : undefined}
		>
			<div 
				className="setting-icon-box" 
				style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
			>
				{icon}
			</div>
			<div className="setting-info">
				<div className="setting-title">{label}</div>
				{value && <div className="setting-subtitle">{value}</div>}
			</div>
			{isSwitch ? (
				<label className="switch">
					<input 
						type="checkbox" 
						checked={switchValue} 
						onChange={(e) => onSwitchChange?.(e.target.checked)} 
					/>
					<span className="slider round"></span>
				</label>
			) : (
				showChevron && <ChevronRight size={16} style={{ opacity: 0.3 }} />
			)}
		</div>
	);
};

export const SettingsScreen = () => {
	const { isDark, toggleTheme } = useTheme();
	const { user, businessId, logout } = useAuth();
	const [businessData, setBusinessData] = useState<any>(null);
	const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);

	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [lowStockAlerts, setLowStockAlerts] = useState(true);

	useEffect(() => {
		if (businessId) {
			fetchBusinessInfo();
		}
	}, [businessId]);

	const fetchBusinessInfo = async () => {
		if (!businessId) return;
		try {
			setIsLoadingBusiness(true);
			const response = await businessApi.getOne(businessId);
			setBusinessData(response.data);
		} catch (error) {
			console.error('Failed to fetch business info', error);
		} finally {
			setIsLoadingBusiness(false);
		}
	};

	return (
		<div className="settings-container">
			<header className="flex-between" style={{ marginBottom: '2.5rem' }}>
				<div>
					<h1 className="text-gradient">Settings</h1>
					<p>Configuration and business profile</p>
				</div>
			</header>

			<section className="profile-banner-luxury">
				<div className="profile-image-wrapper" style={{ margin: '0 auto 1.5rem' }}>
					<div className="profile-avatar" style={{ width: '100px', height: '100px', margin: '0 auto' }}>
						{businessData?.logoUrl ? (
							<img src={businessData.logoUrl} alt="Business Logo" />
						) : (
							<div style={{ width: '100%', height: '100%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', borderRadius: '30px' }}>
								<Briefcase size={36} color="white" />
							</div>
						)}
					</div>
					<button className="camera-badge">
						<Camera size={14} color="white" />
					</button>
				</div>
				<h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{businessData?.name || 'Your Business'}</h2>
				<p style={{ opacity: 0.6, fontSize: '1rem', marginBottom: '1.5rem' }}>{user?.firstName} {user?.lastName} • Account Owner</p>
				
				<div className="stats-badges" style={{ justifyContent: 'center' }}>
					<div className="badge">
						<span className="badge-val">Professional</span>
						<span className="badge-label">Plan</span>
					</div>
					<div className="badge-divider"></div>
					<div className="badge">
						<span className="badge-val">Active</span>
						<span className="badge-label">Status</span>
					</div>
				</div>
			</section>

			<div className="settings-sections">
				<div className="settings-group">
					<h3 className="settings-section-title">Business Operations</h3>
					<div className="card settings-card-luxury">
						<SettingItem
							icon={<Briefcase size={20} />}
							label="Business Profile"
							value="Name, logo, contact details"
							onPress={() => alert('Profile editing is coming in the next update!')}
						/>
						<SettingItem
							icon={<DollarSign size={20} />}
							label="Pricing & Currency"
							value="₦ (NGN) - Nigerian Naira"
						/>
						<SettingItem
							icon={<Clock size={20} />}
							label="Working Hours"
							value="Set your production schedule"
						/>
					</div>
				</div>

				<div className="settings-group">
					<h3 className="settings-section-title">App Preferences</h3>
					<div className="card settings-card-luxury">
						<SettingItem
							icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
							label="Appearance"
							value={isDark ? 'Dark Mode Active' : 'Light Mode Active'}
							isSwitch={true}
							switchValue={isDark}
							onSwitchChange={toggleTheme}
							color="#8B5CF6"
						/>
						<SettingItem
							icon={<Bell size={20} />}
							label="Notifications"
							value="Alerts for orders and stock"
							isSwitch={true}
							switchValue={notificationsEnabled}
							onSwitchChange={setNotificationsEnabled}
							color="#3B82F6"
						/>
						<SettingItem
							icon={<Smartphone size={20} />}
							label="Inventory Alerts"
							value="Notify when stock is low"
							isSwitch={true}
							switchValue={lowStockAlerts}
							onSwitchChange={setLowStockAlerts}
							color="#F59E0B"
						/>
					</div>
				</div>

				<div className="settings-group">
					<h3 className="settings-section-title">System & Diagnostics</h3>
					<div className="card settings-card-luxury">
						<div style={{ padding: '1.25rem' }}>
							<div className="flex-between" style={{ marginBottom: '1rem' }}>
								<div className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
									<Activity size={16} color="var(--primary-color)" /> Connection Status
								</div>
								<span className="status-badge ready" style={{ fontSize: '0.6rem' }}>Stable</span>
							</div>
							<div style={{ fontSize: '0.8rem', opacity: 0.6, background: 'var(--input-bg)', padding: '1rem', borderRadius: '12px' }}>
								<div className="flex-between" style={{ marginBottom: '0.5rem' }}>
									<span>Business ID</span>
									<code style={{ fontWeight: 800 }}>{businessId?.slice(0, 8)}...</code>
								</div>
								<div className="flex-between">
									<span>Account ID</span>
									<code style={{ fontWeight: 800 }}>{user?.id?.slice(0, 8)}...</code>
								</div>
							</div>
							<button 
								className="text-btn" 
								style={{ marginTop: '1rem', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}
								onClick={() => alert('Diagnostics: All systems operational.')}
							>
								Run Full Diagnostic Test <ChevronRight size={14} />
							</button>
						</div>
					</div>
				</div>

				<div className="danger-zone-luxury">
					<div className="flex-between">
						<div>
							<h4 style={{ margin: 0, color: 'var(--danger-color)', fontSize: '1.1rem' }}>Log Out</h4>
							<p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', opacity: 0.6 }}>Securely exit your session</p>
						</div>
						<button 
							className="primary-btn" 
							style={{ width: 'auto', background: 'var(--danger-color)' }}
							onClick={() => {
								if (window.confirm('Are you sure you want to log out?')) logout();
							}}
						>
							<LogOut size={18} /> Exit App
						</button>
					</div>
				</div>

				<div className="version-info" style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
					Arcseams Tailor Suite • v1.0.0 (Stable)
				</div>
			</div>
		</div>
	);
};
