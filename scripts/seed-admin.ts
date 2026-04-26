import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("VITE_FIREBASE_PROJECT_ID missing in .env");
  process.exit(1);
}

// Initialize admin with project ID
initializeApp({
  projectId: projectId
});

const db = getFirestore();

async function seed() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/data.json');
    if (!fs.existsSync(dataPath)) {
      console.error(`Data file not found at ${dataPath}`);
      return;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log("Seeding menu and inventory using Admin SDK...");
    const batch = db.batch();

    for (const item of data.menu) {
      // Seed Menu
      const menuRef = db.collection('menu').doc(item.id);
      batch.set(menuRef, {
        ...item,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Seed Inventory
      const inventoryRef = db.collection('inventory').doc(item.id);
      batch.set(inventoryRef, {
        name: item.name,
        price: item.price,
        type: item.type,
        stock: item.stock,
        category: item.category,
        lastRestocked: FieldValue.serverTimestamp()
      });
      
      console.log(`- Prepared: ${item.name}`);
    }

    await batch.commit();
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    process.exit();
  }
}

seed();
