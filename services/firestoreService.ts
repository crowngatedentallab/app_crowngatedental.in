
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
    runTransaction
} from "firebase/firestore";
import { Order, User, Product, UserRole, OrderStatus } from "../types";

export const firestoreService = {
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
                const sequencePart = nextSeq.toString().padStart(4, '0');
                return `${productCode}-${sequencePart}`;
            });

            // 3. Save Order with generated ID
            // We use setDoc with specific ID instead of addDoc (which generates random ID)
            // Wait, the Requirement says "Save generated order ID into orders collection".
            // Typically Firestore ID is the document ID. Let's use the nice ID as the Doc ID too!
            // It makes looking up orders easier.
            await setDoc(doc(db, "orders", newOrderId), {
                ...order,
                id: newOrderId // Ensure ID is part of data too
            });

            return newOrderId;

        } catch (e) {
            console.error("Transaction failed: ", e);
            throw e;
        }
    },

    updateOrder: async (id: string, order: Partial<Order>): Promise<void> => {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, order);
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
        await deleteDoc(doc(db, "products", id));
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
