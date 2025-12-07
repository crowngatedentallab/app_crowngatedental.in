
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { User } from "../types";

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", "==", username),
        where("password", "==", password)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Add ID to data if missing, logic depends on firestore data structure
      const data = snapshot.docs[0].data();
      const user = { id: snapshot.docs[0].id, ...data } as User;

      localStorage.setItem('crowngate_user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('crowngate_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('crowngate_user');
    return stored ? JSON.parse(stored) : null;
  }
};
