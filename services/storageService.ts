
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const storageService = {
    uploadFile: async (file: File, path: string = 'uploads'): Promise<string> => {
        try {
            const timestamp = Date.now();
            const uniqueName = `${timestamp}_${file.name}`;
            const storageRef = ref(storage, `${path}/${uniqueName}`);

            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return url;
        } catch (error) {
            console.error("Upload failed", error);
            throw error;
        }
    }
};
