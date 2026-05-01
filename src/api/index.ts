import { db, auth, storage } from '../firebase';
import {
	collection,
	doc,
	getDocs,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	setDoc,
	increment,
} from 'firebase/firestore';
import {
	ref,
	uploadBytes,
	getDownloadURL,
} from 'firebase/storage';
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
} from 'firebase/auth';

let currentBusinessId: string | null = null;
export const setApiBusinessId = (id: string | null) => {
	currentBusinessId = id;
};

// Helper to format response like Axios
const toAxiosResponse = (data: any) => ({ data });

export const storageApi = {
	uploadImage: async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		
		const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
		const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
		
		if (!uploadPreset || !cloudName) {
			throw new Error('Cloudinary configuration is missing. Please check your .env file.');
		}
		
		formData.append('upload_preset', uploadPreset);
		
		const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
			method: 'POST',
			body: formData,
		});
		
		const data = await response.json();
		if (data.error) throw new Error(data.error.message);
		return data.secure_url;
	},
};

export const authApi = {
	login: async (data: any) => {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			data.email,
			data.password,
		);
		// Fetch business ID from user document
		const userDocRef = doc(db, 'users', userCredential.user.uid);
		const userDoc = await getDoc(userDocRef);
		const userData = userDoc.data();

		let businessId = userData?.businessId;

		if (!businessId) {
			console.log('BusinessId missing from user doc, searching businesses collection...');
			const q = query(collection(db, 'businesses'), where('ownerId', '==', userCredential.user.uid));
			const businessSnap = await getDocs(q);
			if (!businessSnap.empty) {
				businessId = businessSnap.docs[0].id;
				console.log('Found owned business:', businessId);
				// Update the user document to persist this link
				await updateDoc(userDocRef, { businessId });
			} else {
				businessId = 'default-business-id';
				console.warn('No business found for user. Using default:', businessId);
			}
		}

		return toAxiosResponse({
			access_token: await userCredential.user.getIdToken(),
			user: {
				id: userCredential.user.uid,
				email: userCredential.user.email,
				...userData,
			},
			businessId: businessId,
		});
	},
	register: async (data: any) => {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			data.email,
			data.password,
		);

		// Create business
		const businessRef = await addDoc(collection(db, 'businesses'), {
			name: data.businessName || 'My Business',
			ownerId: userCredential.user.uid,
			createdAt: new Date().toISOString(),
		});

		const userData = {
			firstName: data.firstName,
			lastName: data.lastName,
			businessId: businessRef.id,
			role: 'owner',
		};

		await setDoc(doc(db, 'users', userCredential.user.uid), userData);

		return toAxiosResponse({
			access_token: await userCredential.user.getIdToken(),
			user: {
				id: userCredential.user.uid,
				email: userCredential.user.email,
				...userData,
			},
			businessId: businessRef.id,
		});
	},
};

export const customerApi = {
	getAll: async () => {
		console.log('Fetching customers for businessId:', currentBusinessId);
		if (!currentBusinessId) return toAxiosResponse([]);
		const q = query(
			collection(db, 'customers'),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	getOne: async (id: string) => {
		const d = await getDoc(doc(db, 'customers', id));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	create: async (data: any) => {
		const ref = await addDoc(collection(db, 'customers'), {
			...data,
			businessId: currentBusinessId,
		});
		return toAxiosResponse({ id: ref.id, ...data });
	},
	update: async (id: string, data: any) => {
		await updateDoc(doc(db, 'customers', id), data);
		return toAxiosResponse({ id, ...data });
	},
	delete: async (id: string) => {
		await deleteDoc(doc(db, 'customers', id));
		return toAxiosResponse({ id });
	},
};

export const inventoryApi = {
	getAll: async () => {
		console.log('Fetching inventory for businessId:', currentBusinessId);
		if (!currentBusinessId) return toAxiosResponse([]);
		const q = query(
			collection(db, 'inventory'),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	getOne: async (id: string) => {
		const d = await getDoc(doc(db, 'inventory', id));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	create: async (data: any) => {
		const mappedData = {
			itemName: data.itemName || data.name,
			qtyOnHand: parseFloat(data.qtyOnHand || data.quantity || '0'),
			costPerUnit: parseFloat(data.costPerUnit || data.costPrice || '0'),
			lowStockThreshold: parseFloat(data.lowStockThreshold || data.reorderLevel || '5'),
			category: data.category,
			unit: data.unit,
			supplier: data.supplier,
			sku: data.sku,
			isDeductible: data.isDeductible !== undefined ? data.isDeductible : true,
			businessId: currentBusinessId,
			createdAt: new Date().toISOString(),
		};
		const ref = await addDoc(collection(db, 'inventory'), mappedData);
		return toAxiosResponse({ id: ref.id, ...mappedData });
	},
	update: async (id: string, data: any) => {
		const docRef = doc(db, 'inventory', id);
		await updateDoc(docRef, data);
		return toAxiosResponse({ id, ...data });
	},
	deduct: async (id: string, amount: number) => {
		const docRef = doc(db, 'inventory', id);
		await updateDoc(docRef, {
			qtyOnHand: increment(-amount)
		});
		return toAxiosResponse({ id, deducted: amount });
	},
	delete: async (id: string) => {
		await deleteDoc(doc(db, 'inventory', id));
		return toAxiosResponse({ id });
	},
};

export const orderApi = {
	getAll: async () => {
		console.log('Fetching orders for businessId:', currentBusinessId);
		if (!currentBusinessId) return toAxiosResponse([]);
		const q = query(
			collection(db, 'orders'),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	getOne: async (id: string) => {
		const d = await getDoc(doc(db, 'orders', id));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	create: async (data: any) => {
		const ref = await addDoc(collection(db, 'orders'), {
			...data,
			businessId: currentBusinessId,
			createdAt: new Date().toISOString(),
		});
		return toAxiosResponse({ id: ref.id, ...data });
	},
	getByCustomer: async (customerId: string) => {
		const q = query(
			collection(db, 'orders'),
			where('customerId', '==', customerId),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	updateStatus: async (id: string, status: string) => {
		await updateDoc(doc(db, 'orders', id), { status });
		return toAxiosResponse({ id, status });
	},
};

export const measurementApi = {
	getByCustomer: async (customerId: string) => {
		const q = query(
			collection(db, 'measurements'),
			where('customerId', '==', customerId),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	getOne: async (id: string) => {
		const d = await getDoc(doc(db, 'measurements', id));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	create: async (data: any) => {
		const ref = await addDoc(collection(db, 'measurements'), {
			...data,
			businessId: currentBusinessId,
		});
		return toAxiosResponse({ id: ref.id, ...data });
	},
	update: async (id: string, data: any) => {
		await updateDoc(doc(db, 'measurements', id), data);
		return toAxiosResponse({ id, ...data });
	},
	delete: async (id: string) => {
		await deleteDoc(doc(db, 'measurements', id));
		return toAxiosResponse({ id });
	},
};

export const businessApi = {
	getMe: async () => {
		if (!currentBusinessId) return toAxiosResponse(null);
		const d = await getDoc(doc(db, 'businesses', currentBusinessId));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	getOne: async (id: string) => {
		const d = await getDoc(doc(db, 'businesses', id));
		return toAxiosResponse({ id: d.id, ...d.data() });
	},
	update: async (id: string, data: any) => {
		await updateDoc(doc(db, 'businesses', id), data);
		return toAxiosResponse({ id, ...data });
	},
	updateSettings: async (id: string, data: any) => {
		await updateDoc(doc(db, 'businesses', id), { settings: data });
		return toAxiosResponse({ id, settings: data });
	},
	inviteUser: async (_id: string, _data: { email: string; role: string }) => {
		// Just a stub for Firebase
		return toAxiosResponse({ success: true, message: 'Invited' });
	},
};

export const notificationsApi = {
	updateToken: async (token: string) => {
		if (auth.currentUser) {
			await updateDoc(doc(db, 'users', auth.currentUser.uid), {
				pushToken: token,
			});
		}
		return toAxiosResponse({ success: true });
	},
};

export const paymentApi = {
	getAll: async () => {
		if (!currentBusinessId) return toAxiosResponse([]);
		const q = query(
			collection(db, 'payments'),
			where('businessId', '==', currentBusinessId),
		);
		const snapshot = await getDocs(q);
		return toAxiosResponse(
			snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
		);
	},
	create: async (data: any) => {
		const ref = await addDoc(collection(db, 'payments'), {
			...data,
			businessId: currentBusinessId,
			createdAt: new Date().toISOString(),
		});
		
		// Update involved orders if any
		if (data.orderIds && data.orderIds.length > 0) {
			for (const orderId of data.orderIds) {
				const orderRef = doc(db, 'orders', orderId);
				const orderSnap = await getDoc(orderRef);
				if (orderSnap.exists()) {
					const orderData = orderSnap.data();
					const currentBalance = parseFloat((orderData.balance !== undefined ? orderData.balance : (orderData.price - (orderData.deposit || 0))).toString().replace(/,/g, ''));
					const currentDeposit = parseFloat((orderData.deposit || 0).toString().replace(/,/g, ''));
					
					await updateDoc(orderRef, { 
						balance: 0,
						deposit: currentDeposit + currentBalance,
						isPaid: true,
						status: orderData.status === 'Delivered' ? 'Delivered' : 'Ready',
						updatedAt: new Date().toISOString()
					});
				}
			}
		}
		
		return toAxiosResponse({ id: ref.id, ...data });
	},
};
