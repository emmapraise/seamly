import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Scissors } from 'lucide-react';

export const LoginScreen = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await authApi.login({ email, password });
			await login(res.data.access_token, res.data.user, res.data.businessId);
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Failed to login. Please check your credentials.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page-container">
			<div className="card auth-card-luxury">
				<div className="auth-logo-section">
					<div className="auth-logo-circle" style={{ padding: 0, overflow: 'hidden' }}>
						<img src="/logo.png" alt="Seamly" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					</div>
					<h1 className="auth-title">Seamly</h1>
					<p className="auth-subtitle">Luxury Studio Management for Tailors</p>
				</div>

				{error && (
					<div className="status-pill cancelled" style={{ width: '100%', marginBottom: '1.5rem', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem' }}>
						{error}
					</div>
				)}

				<form onSubmit={handleLogin} className="dynamic-form">
					<div className="input-group">
						<label className="flex items-center gap-2"><Mail size={16} /> Email Address</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="you@example.com"
						/>
					</div>
					<div className="input-group" style={{ marginTop: '1.25rem' }}>
						<label className="flex items-center gap-2"><Lock size={16} /> Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="••••••••"
						/>
					</div>

					<button type="submit" disabled={loading} className="primary-btn" style={{ marginTop: '2.5rem' }}>
						{loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In to Dashboard'}
					</button>
				</form>

				<p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
					Don't have an account yet? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Start Free Trial</Link>
				</p>
			</div>
		</div>
	);
};
