import { auth, db, storage } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// LOGIN
export async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// LOGOUT
export async function logout() {
  return signOut(auth);
}

// FETCH USERS
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// CREATE ORDER
export async function createOrder(orderData: any) {
  return addDoc(collection(db, "orders"), orderData);
}

// FETCH ORDERS BASED ON ROLE
export async function getOrdersByRole(role: string, name: string) {
  const col = collection(db, "orders");

  let q;

  if (role === "ADMIN") {
    q = query(col);
  } else if (role === "DOCTOR") {
    q = query(col, where("doctorName", "==", name));
  } else if (role === "TECHNICIAN") {
    q = query(col, where("assignedTech", "==", name));
  }

  const snapshot = await getDocs(q!);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// UPDATE ORDER
export async function updateOrder(id: string, newData: any) {
  return updateDoc(doc(db, "orders", id), newData);
}

// FILE UPLOAD
export async function uploadFile(file: File) {
  const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
