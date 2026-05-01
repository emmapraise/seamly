import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, LogOut, ShoppingBag, Package, Settings as SettingsIcon, Scissors, CreditCard, ShoppingCart, Banknote } from 'lucide-react';

export const Layout = () => {
	const { logout, user } = useAuth();
	const location = useLocation();

	const links = [
		{ path: '/', label: 'Dashboard', icon: <Home size={22} /> },
		{ path: '/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
		{ path: '/checkout', label: 'Checkout', icon: <ShoppingCart size={22} /> },
		{ path: '/payments', label: 'Payments', icon: <Banknote size={22} /> },
		{ path: '/clients', label: 'Clients', icon: <Users size={22} /> },
		{ path: '/inventory', label: 'Inventory', icon: <Package size={22} /> },
		{ path: '/settings', label: 'Settings', icon: <SettingsIcon size={22} /> },
	];

	return (
		<div className="layout-container">
			{/* Sidebar for Desktop */}
			<aside className="sidebar">
				<div className="sidebar-header">
					<div className="flex items-center gap-3">
						<img src="/logo.png" alt="Seamly Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
						<h2 className="text-gradient" style={{ margin: 0 }}>Seamly</h2>
					</div>
				</div>

				<nav className="sidebar-nav">
					{links.map((link) => {
						const isActive = link.path === '/' 
							? location.pathname === '/' 
							: location.pathname.startsWith(link.path);
							
						return (
							<Link
								key={link.path}
								to={link.path}
								className={`nav-link ${isActive ? 'active' : ''}`}
							>
								{link.icon}
								<span>{link.label}</span>
							</Link>
						);
					})}
				</nav>

				<div className="sidebar-footer">
					<div className="user-profile-mini">
						<img 
							src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0F1C3F&color=fff`} 
							alt="Profile" 
							className="avatar-small"
						/>
						<div className="user-info">
							<span className="user-name">{user?.firstName} {user?.lastName}</span>
							<span className="user-role">Business Owner</span>
						</div>
					</div>
					<button className="logout-btn" onClick={logout}>
						<LogOut size={20} />
						<span>Logout</span>
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="main-content">
				<Outlet />
			</main>

			{/* Bottom Nav for Mobile */}
			<nav className="bottom-nav">
				{links.map((link) => {
					const isActive = link.path === '/' 
						? location.pathname === '/' 
						: location.pathname.startsWith(link.path);
						
					return (
						<Link
							key={link.path}
							to={link.path}
							className={`bottom-nav-link ${isActive ? 'active' : ''}`}
						>
							{link.icon}
							<span>{link.label}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
};
