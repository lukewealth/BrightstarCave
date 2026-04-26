import { 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { app } from './firebase';

/**
 * Optimized Firestore Initialization
 * 1. Enables offline persistence for a "Luxury" feel even on spotty connections.
 * 2. Implements multiple-tab synchronization.
 */
export const initializeOptimizedFirestore = async () => {
  try {
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log("🚀 Firestore Optimized: Offline persistence & multi-tab sync enabled.");
    return db;
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore Persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore Persistence: The current browser does not support all of the features required to enable persistence.");
    }
    // Fallback to default firestore
    return null;
  }
};
