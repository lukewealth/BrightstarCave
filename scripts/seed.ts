import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  const email = process.env.VITE_ADMIN_EMAIL;
  const password = process.env.VITE_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Admin credentials missing in .env");
    return;
  }

  console.log(`Authenticating as ${email}...`);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authenticated successfully.");

    const dataPath = path.join(process.cwd(), 'src/data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log("Seeding menu and inventory...");
    for (const item of data.menu) {
      // Seed Menu
      await setDoc(doc(db, 'menu', item.id), {
        ...item,
        updatedAt: serverTimestamp()
      });

      // Seed Inventory (using same ID)
      await setDoc(doc(db, 'inventory', item.id), {
        name: item.name,
        price: item.price,
        type: item.type,
        stock: item.stock,
        category: item.category,
        lastRestocked: serverTimestamp()
      });
      
      console.log(`- Seeded: ${item.name}`);
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    process.exit();
  }
}

seed();
