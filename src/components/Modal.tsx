import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-content card">
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
