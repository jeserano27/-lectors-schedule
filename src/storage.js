/**
 * Storage module — Firebase Firestore with timeout and retry
 */

import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const COLLECTION = "appdata";
const TIMEOUT_MS = 10000; // 10 second timeout

// Helper: wrap a promise with a timeout
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

export async function storageGet(key) {
  try {
    const ref = doc(db, COLLECTION, key);
    const snap = await withTimeout(getDoc(ref), TIMEOUT_MS);
    if (snap.exists()) {
      return JSON.parse(snap.data().value);
    }
    return null;
  } catch (e) {
    console.error("storageGet error:", key, e.message);
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    const ref = doc(db, COLLECTION, key);
    await withTimeout(
      setDoc(ref, { value: JSON.stringify(value), updatedAt: Date.now() }),
      TIMEOUT_MS
    );
    return true;
  } catch (e) {
    console.error("storageSet error:", key, e.message);
    return false;
  }
}

export async function storageDelete(key) {
  try {
    const ref = doc(db, COLLECTION, key);
    await withTimeout(deleteDoc(ref), TIMEOUT_MS);
    return true;
  } catch (e) {
    console.error("storageDelete error:", key, e.message);
    return false;
  }
}
