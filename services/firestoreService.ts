
import { db } from "../firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDoc,
    setDoc,
    runTransaction,
    arrayUnion,
    // orderBy, // Unused after fix
    // limit // Unused after fix
} from "firebase/firestore";
import { Order, User, Product, UserRole, OrderStatus, Notification } from "../types";

export const firestoreService = {
    // --- NOTIFICATIONS ---
    getNotifications: async (userId: string): Promise<Notification[]> => {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId)
            // Removed orderBy("createdAt", "desc") and limit(20) to avoid needing a composite index for now.
            // Client-side sort is sufficient for low volume.
        );
        const snapshot = await getDocs(q);
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        // Client-side sort
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
    },

    createNotification: async (notification: Omit<Notification, 'id'>) => {
        await addDoc(collection(db, "notifications"), notification);
    },

    markNotificationRead: async (id: string) => {
        await updateDoc(doc(db, "notifications", id), { read: true });
    },

    // --- COUNTERS ---
    getCounter: async (productCode: string): Promise<number> => {
        const counterRef = doc(db, "counters", productCode);
        const counterDoc = await getDoc(counterRef);
        return counterDoc.exists() ? (counterDoc.data().lastSequence || 0) : 0;
    },

    updateCounter: async (productCode: string, newSequence: number): Promise<void> => {
        const counterRef = doc(db, "counters", productCode);
        await setDoc(counterRef, { lastSequence: newSequence }, { merge: true });
    },

    // --- USERS ---
    getUsers: async (): Promise<User[]> => {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },

    createUser: async (user: Omit<User, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, "users"), user);
        return docRef.id;
    },

    updateUser: async (id: string, user: Partial<User>): Promise<void> => {
        const userRef = doc(db, "users", id);
        await updateDoc(userRef, user);
    },

    deleteUser: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, "users", id));
    },

    // --- ORDERS ---
    getOrders: async (): Promise<Order[]> => {
        const querySnapshot = await getDocs(collection(db, "orders"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    },

    getOrdersByRole: async (role: UserRole, userName: string): Promise<Order[]> => {
        const ordersRef = collection(db, "orders");
        let q;

        if (role === UserRole.ADMIN) {
            // Admin sees all
            return firestoreService.getOrders();
        } else if (role === UserRole.DOCTOR) {
            q = query(ordersRef, where("doctorName", "==", userName));
        } else if (role === UserRole.TECHNICIAN) {
            q = query(ordersRef, where("assignedTech", "==", userName));
        }

        if (q) {
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Order));
        }
        return [];
    },

    createOrder: async (order: Omit<Order, 'id'>): Promise<string> => {
        // 1. Get Product Code
        let productCode = 'GEN'; // Fallback
        if (order.typeOfWork) {
            try {
                // Assuming typeOfWork stores product NAME currently, or ID?
                // The form stores "name" in value currently in DoctorDashboard.
                // We should ideally look up the product to get its code.
                // For now, let's try to find the product by name.
                const productsRef = collection(db, "products");
                const q = query(productsRef, where("name", "==", order.typeOfWork));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const prodData = querySnapshot.docs[0].data() as Product;
                    if (prodData.code) {
                        productCode = prodData.code;
                    } else {
                        // Generate a code from name if missing
                        productCode = order.typeOfWork.substring(0, 2).toUpperCase();
                    }
                } else {
                    productCode = order.typeOfWork.substring(0, 2).toUpperCase();
                }
            } catch (e) {
                console.error("Error fetching product code", e);
            }
        }

        // 2. Run Transaction to generate ID
        const counterRef = doc(db, "counters", productCode);

        try {
            const newOrderId = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                let currentSeq = 0;
                if (counterDoc.exists()) {
                    currentSeq = counterDoc.data().lastSequence || 0;
                }

                const nextSeq = currentSeq + 1;
                transaction.set(counterRef, { lastSequence: nextSeq }, { merge: true });

                // Format: ZC-0001
                // User Request: If last was 432, next should be 433.
                // We keep 4 digit padding for consistency, but if sequence > 9999 it expands.
                const sequencePart = nextSeq.toString().padStart(4, '0');
                if (productCode.includes('-')) {
                    // If code already has hyphen e.g. "CPFM", we just append sequence.
                    // But user typically wants "CPFM-0043".
                    // If user complains about format "CPFM-433-0001", it means product code was "CPFM-433".
                    // We should just produce `${productCode}-${sequencePart}`.
                }
                return `${productCode}-${sequencePart}`;
            });

            // 3. Save Order with generated ID
            const newOrderData: Order = {
                ...order,
                id: newOrderId,
                submissionDate: order.submissionDate || new Date().toISOString().split('T')[0], // Ensure YYYY-MM-DD
                technicianHistory: order.assignedTech ? [order.assignedTech] : []
            };

            await setDoc(doc(db, "orders", newOrderId), newOrderData);

            // NOTIFICATION: Notify Admins of new order
            const users = await firestoreService.getUsers();
            const admins = users.filter(u => u.role === UserRole.ADMIN);
            for (const admin of admins) {
                await firestoreService.createNotification({
                    userId: admin.id,
                    title: "New Order Received",
                    message: `Dr. ${order.doctorName} submitted case ${newOrderId}`,
                    type: 'info',
                    read: false,
                    createdAt: new Date().toISOString(),
                    link: `/orders` // Admin view doesn't have deep link yet, but dashboard is fine
                });
            }

            return newOrderId;

        } catch (e) {
            console.error("Transaction failed: ", e);
            throw e;
        }
    },

    updateOrder: async (id: string, updates: Partial<Order>): Promise<void> => {
        // Check if we are updating the Product (Type of Work)
        if (updates.typeOfWork) {
            const orderRef = doc(db, "orders", id);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const currentOrder = orderSnap.data() as Order;

                // Only proceed if type effectively changed
                if (currentOrder.typeOfWork !== updates.typeOfWork) {

                    // 1. Find the new Product Code
                    const productsQuery = query(collection(db, "products"), where("name", "==", updates.typeOfWork));
                    const productSnap = await getDocs(productsQuery);

                    if (!productSnap.empty) {
                        const productCode = productSnap.docs[0].data().code;

                        if (productCode) {
                            // 2. Generate New ID via Transaction
                            const counterRef = doc(db, "counters", productCode);
                            let newOrderId = "";

                            try {
                                newOrderId = await runTransaction(db, async (transaction) => {
                                    const counterDoc = await transaction.get(counterRef);
                                    const currentSeq = counterDoc.exists() ? (counterDoc.data().lastSequence || 0) : 0;
                                    const nextSeq = currentSeq + 1;
                                    transaction.set(counterRef, { lastSequence: nextSeq }, { merge: true });

                                    const sequencePart = nextSeq.toString().padStart(4, '0');
                                    // See createOrder for note on format
                                    return `${productCode}-${sequencePart}`;
                                });

                                // 3. Create New Document
                                await setDoc(doc(db, "orders", newOrderId), {
                                    ...currentOrder,
                                    ...updates,
                                    id: newOrderId // Update ID field
                                });

                                // 4. Delete Old Document
                                await deleteDoc(orderRef);
                                return; // Exit, we are done

                            } catch (error) {
                                console.error("Failed to regenerate Order ID:", error);
                                // Fallback: just update the existing doc if generation fails? 
                                // No, better to throw or let it fall through to normal update if critical.
                                // But if transaction fails, we shouldn't update partially.
                                throw error;
                            }
                        }
                    }
                }
            }
        }

        // Standard Update (No ID change)
        const orderRef = doc(db, "orders", id);

        const finalUpdates: any = { ...updates };
        const timestamp = new Date().toISOString();

        // NOTIFICATIONS
        // 1. Tech Assigned
        if (updates.assignedTech && updates.assignedTech !== (await getDoc(orderRef)).data()?.assignedTech) {
            finalUpdates.technicianHistory = arrayUnion(updates.assignedTech);

            // Find Tech ID to notify
            const users = await firestoreService.getUsers();
            const tech = users.find(u => u.fullName === updates.assignedTech && u.role === UserRole.TECHNICIAN);
            if (tech) {
                await firestoreService.createNotification({
                    userId: tech.id,
                    title: "New Case Assigned",
                    message: `You have been assigned case ${id}`,
                    type: 'warning',
                    read: false,
                    createdAt: timestamp
                });
            }

            // NOTIFY ADMINS of Assignment
            const admins = users.filter(u => u.role === UserRole.ADMIN);
            for (const admin of admins) {
                await firestoreService.createNotification({
                    userId: admin.id,
                    title: "Technician Assigned",
                    message: `Case ${id} assigned to ${updates.assignedTech}`,
                    type: 'info',
                    read: false,
                    createdAt: timestamp
                });
            }
        }

        // 2. Status Changed -> Notify Doctor
        if (updates.status) {
            const currentOrder = (await getDoc(orderRef)).data() as Order;
            if (currentOrder && updates.status !== currentOrder.status) {
                // Find Doctor ID
                const users = await firestoreService.getUsers();
                const doctor = users.find(u => u.fullName === currentOrder.doctorName && u.role === UserRole.DOCTOR);

                if (doctor && (updates.status === OrderStatus.DISPATCHED || updates.status === OrderStatus.DELIVERED || updates.status === OrderStatus.RECEIVED)) {
                    await firestoreService.createNotification({
                        userId: doctor.id,
                        title: `Case ${updates.status}`,
                        message: `Order #${id} for ${currentOrder.patientName} is now ${updates.status}`,
                        type: 'success',
                        read: false,
                        createdAt: timestamp
                    });
                }

                // NOTIFY ADMINS of Status Change
                // Reuse users from above or fetch if undefined (but expected to be defined if we are here)
                const allUsers = await firestoreService.getUsers();
                const adminsToNotify = allUsers.filter(u => u.role === UserRole.ADMIN);
                for (const admin of adminsToNotify) {
                    await firestoreService.createNotification({
                        userId: admin.id,
                        title: "Status Update",
                        message: `Order #${id} is now ${updates.status}`,
                        type: 'info',
                        read: false,
                        createdAt: timestamp
                    });
                }
            }
        }

        await updateDoc(orderRef, finalUpdates);
    },

    deleteOrder: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, "orders", id));
    },

    // --- PRODUCTS ---
    getProducts: async (): Promise<Product[]> => {
        const querySnapshot = await getDocs(collection(db, "products"));
        // If empty, return defaults but don't auto-create here to avoid side effects on every get
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return products.length > 0 ? products : [];
    },

    createProduct: async (product: Omit<Product, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, "products"), product);
        return docRef.id;
    },

    updateProduct: async (id: string, product: Partial<Product>): Promise<void> => {
        const prodRef = doc(db, "products", id);
        await updateDoc(prodRef, product);
    },

    deleteProduct: async (id: string): Promise<void> => {
        // 1. Get the product name before deleting to find related orders
        const prodRef = doc(db, "products", id);
        const prodSnap = await getDoc(prodRef);

        if (prodSnap.exists()) {
            const prodName = prodSnap.data().name;

            // 2. Find all orders with this product type
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("typeOfWork", "==", prodName));
            const querySnapshot = await getDocs(q);

            // 3. Update them to "Product Not Found"
            // Using Promise.all for parallel updates
            const updatePromises = querySnapshot.docs.map(doc =>
                updateDoc(doc.ref, { typeOfWork: "Product Not Found" })
            );
            await Promise.all(updatePromises);
        }

        // 4. Delete the product
        await deleteDoc(prodRef);
    },

    // --- INITIALIZATION ---
    initializeDefaults: async () => {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        if (snapshot.empty) {
            console.log("Seeding default admin user...");
            await addDoc(usersRef, {
                username: "admin",
                password: "123", // In production, hash this!
                fullName: "System Admin",
                role: UserRole.ADMIN
            });
        }

        const productsRef = collection(db, "products");
        // Product seeding disabled per user request to allow custom list management
        // const prodSnapshot = await getDocs(productsRef);
        // if (prodSnapshot.empty) {
        //     console.log("Seeding default products...");
        //     const defaults = [
        //         { name: "Zirconia Crown", code: "ZC" },
        //         { name: "E-Max Veneer", code: "EMV" },
        //         { name: "PFM Bridge", code: "PFM" },
        //         { name: "Implant Abutment", code: "IMP" }
        //     ];
        //     for (const item of defaults) {
        //         await addDoc(productsRef, { 
        //             name: item.name, 
        //             code: item.code, 
        //             isActive: true 
        //         });
        //     }
        // }
    }
};
