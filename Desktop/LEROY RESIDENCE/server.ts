import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from './src/firebase-applet-config.json';

// Initialize Firebase for the server (to fetch feeds)
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

  const DATA_DIR = path.join(process.cwd(), 'data');
  const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  // Initial properties if file doesn't exist
  if (!fs.existsSync(PROPERTIES_FILE)) {
    fs.writeFileSync(PROPERTIES_FILE, JSON.stringify([], null, 2));
  }

  // API Routes
  app.get("/api/properties", async (req, res) => {
    try {
      const q = query(collection(db, 'properties'), orderBy('id', 'desc'));
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => doc.data());
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties from Firestore:", error);
      res.json([]);
    }
  });

  app.post("/api/properties", (req, res) => {
    // This endpoint is now deprecated in favor of direct Firestore writes from client
    res.status(410).json({ error: "Use direct Firestore writes" });
  });

  // Feeds for Portals
  app.get("/api/feeds/facebook.xml", async (req, res) => {
    try {
      const q = query(collection(db, 'properties'), orderBy('id', 'desc'));
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => doc.data());
      
      let xml = `<?xml version="1.0"?>
<listings>
  <title>LeRoy Residence Feed</title>
  <link>${req.protocol}://${req.get('host')}</link>
  <description>Propiedades de Lujo en Chile</description>
  ${properties.map((p: any) => `
  <listing>
    <home_listing_id>${p.id}</home_listing_id>
    <name>${p.title}</name>
    <description>${p.description}</description>
    <address format="simple">
      <component name="city">${p.location}</component>
      <component name="country">Chile</component>
    </address>
    <price>${p.price} ${p.currency}</price>
    <url>${req.protocol}://${req.get('host')}/property/${p.id}</url>
    <image>
      <url>${p.imageUrl}</url>
    </image>
    <listing_type>for_${p.listingType === 'sale' ? 'sale' : 'rent'}</listing_type>
    <num_beds>${p.bedrooms}</num_beds>
    <num_baths>${p.bathrooms}</num_baths>
  </listing>`).join('')}
</listings>`;

      res.header('Content-Type', 'text/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).send("Error generating feed");
    }
  });

  // Generic XML Feed for other portals (like Portal Inmobiliario / TocToc style)
  app.get("/api/feeds/universal.xml", async (req, res) => {
    try {
      const q = query(collection(db, 'properties'), orderBy('id', 'desc'));
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => doc.data());
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<property_feed>
  <provider>LeRoy Residence</provider>
  <properties>
    ${properties.map((p: any) => `
    <property>
      <id>${p.id}</id>
      <title><![CDATA[${p.title}]]></title>
      <subtitle><![CDATA[${p.subtitle}]]></subtitle>
      <type>${p.type}</type>
      <operation>${p.listingType}</operation>
      <price currency="${p.currency}">${p.price}</price>
      <location>
        <city>${p.location}</city>
        <country>Chile</country>
      </location>
      <features>
        <bedrooms>${p.bedrooms}</bedrooms>
        <bathrooms>${p.bathrooms}</bathrooms>
        <parking>${p.parking}</parking>
        <area unit="m2">${p.area}</area>
        <land_area unit="m2">${p.landArea}</land_area>
      </features>
      <description><![CDATA[${p.description}]]></description>
      <images>
        <image>${p.imageUrl}</image>
        ${(p.categoryImages || []).map((img: any) => `<image>${img.imageUrl}</image>`).join('')}
      </images>
      <url>${req.protocol}://${req.get('host')}/property/${p.id}</url>
    </property>`).join('')}
  </properties>
</property_feed>`;

      res.header('Content-Type', 'text/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).send("Error generating feed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
