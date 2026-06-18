import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Scissors, User, Briefcase } from 'lucide-react';

export const RegisterScreen = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [businessName, setBusinessName] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await authApi.register({
				email,
				password,
				firstName,
				lastName,
				businessName,
			});
			await login(res.data.access_token, res.data.user, res.data.businessId);
			navigate('/');
		} catch (err: any) {
			const message = err.response?.data?.message || err.message || 'Failed to register';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setError('');
		setLoading(true);

		try {
			const res = await authApi.loginWithGoogle();
			await login(res.data.access_token, res.data.user, res.data.businessId);
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Failed to sign in with Google.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page-container">
			<div className="card auth-card-luxury" style={{ maxWidth: '500px' }}>
				<div className="auth-logo-section">
					<div className="auth-logo-circle" style={{ padding: 0, overflow: 'hidden' }}>
						<img src="/logo.png" alt="Seamly" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					</div>
					<h1 className="auth-title">Join Seamly</h1>
					<p className="auth-subtitle">Premium Management for Professional Tailors</p>
				</div>

				{error && (
					<div className="status-pill cancelled" style={{ width: '100%', marginBottom: '1.5rem', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem' }}>
						{error}
					</div>
				)}

				<form onSubmit={handleRegister} className="dynamic-form">
					<div className="grid grid-cols-2">
						<div className="input-group">
							<label className="flex items-center gap-2"><User size={14} /> First Name</label>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
								placeholder="John"
							/>
						</div>
						<div className="input-group">
							<label className="flex items-center gap-2"><User size={14} /> Last Name</label>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
								placeholder="Doe"
							/>
						</div>
					</div>

					<div className="input-group" style={{ marginTop: '1.25rem' }}>
						<label className="flex items-center gap-2"><Briefcase size={14} /> Business Name</label>
						<input
							type="text"
							value={businessName}
							onChange={(e) => setBusinessName(e.target.value)}
							required
							placeholder="e.g. Elegant Stitches"
						/>
					</div>

					<div className="input-group" style={{ marginTop: '1.25rem' }}>
						<label className="flex items-center gap-2"><Mail size={14} /> Email Address</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="you@example.com"
						/>
					</div>

					<div className="input-group" style={{ marginTop: '1.25rem' }}>
						<label className="flex items-center gap-2"><Lock size={14} /> Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="Min. 8 characters"
						/>
					</div>

					<button type="submit" disabled={loading} className="primary-btn" style={{ marginTop: '2.5rem' }}>
						{loading ? <Loader2 className="animate-spin" size={20} /> : 'Create My Studio'}
					</button>
				</form>

				<div className="auth-divider">or</div>

				<button 
					type="button" 
					disabled={loading} 
					onClick={handleGoogleLogin} 
					className="google-btn"
				>
					<svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Continue with Google
				</button>

				<p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
					Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
				</p>
			</div>
		</div>
	);
};
