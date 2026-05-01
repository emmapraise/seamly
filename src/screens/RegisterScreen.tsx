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

				<p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
					Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
				</p>
			</div>
		</div>
	);
};
