/**
 * Storage module — replaces Claude's window.storage with Firebase Firestore
 * All data is shared across all users via Firestore.
 */

import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// All keys go into a single Firestore collection "appdata"
const COLLECTION = "appdata";

export async function storageGet(key) {
  try {
    const ref = doc(db, COLLECTION, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return JSON.parse(snap.data().value);
    }
    return null;
  } catch (e) {
    console.error("storageGet error:", key, e);
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    const ref = doc(db, COLLECTION, key);
    await setDoc(ref, { value: JSON.stringify(value), updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error("storageSet error:", key, e);
    return false;
  }
}

export async function storageDelete(key) {
  try {
    const ref = doc(db, COLLECTION, key);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error("storageDelete error:", key, e);
    return false;
  }
}
