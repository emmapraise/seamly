import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	size?: 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className={`modal-content card modal-${size}`}>
				<div className="modal-header">
					<h3>{title}</h3>
					<button className="close-button" onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<div className="modal-body">
					{children}
				</div>
			</div>
		</div>
	);
};
