
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
    setDoc
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
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        }
        return [];
    },

    createOrder: async (order: Omit<Order, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, "orders"), order);
        return docRef.id;
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
        const prodSnapshot = await getDocs(productsRef);
        if (prodSnapshot.empty) {
            console.log("Seeding default products...");
            const defaults = ["Zirconia Crown", "E-Max Veneer", "PFM Bridge", "Implant Abutment"];
            for (const name of defaults) {
                await addDoc(productsRef, { name });
            }
        }
    }
};
