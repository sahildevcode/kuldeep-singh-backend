import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ARTWORKS_FILE = path.join(DATA_DIR, 'artworks.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample seed if database is clean
const INITIAL_SEED_ORDERS = [
  {
    id: 'ORD_00932',
    customerName: 'Rajesh & Sunita Oberoi',
    customerEmail: 'oberoi.residence@oberoigroup.com',
    customerPhone: '+91 98100 88231',
    customerCity: 'Golf Links',
    customerState: 'New Delhi',
    date: '18 Aug, 2026',
    orderTime: '01:05 PM',
    orderMonth: '2026-08',
    items: [
      {
        id: 'art-05',
        type: 'artwork',
        title: 'Serenade at Dawn',
        subtitle: 'Charcoal & Raw Umber Study on Archival Paper',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        mediumOrCategory: 'Charcoal & Graphite'
      }
    ],
    subtotal: 95000,
    discount: 0,
    shipping: 0,
    totalAmount: 95000,
    paymentMethod: 'Direct Bank RTGS Transfer',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    currentStep: 4,
    stepStatus: 'delivered',
    deliveryAddress: 'Bungalow 14, Golf Links, New Delhi 110003',
    trackingNumber: 'BLUEDART-EXP-77210',
    stepTimestamps: {
      placed: '01:05 PM, 18 Aug, 2026',
      accepted: '02:30 PM, 18 Aug, 2026',
      dispatched: '10:00 AM, 19 Aug, 2026',
      delivered: '04:15 PM, 20 Aug, 2026'
    }
  }
];

const INITIAL_SEED_ARTWORKS = [
  {
    id: 'art-01',
    title: 'Symphony of the Solitary Tide',
    subtitle: 'Study on Luminosity & Deep Coastal Light',
    year: 2025,
    medium: 'Oil on Canvas',
    dimensions: '40 x 54 in (101 x 137 cm)',
    price: 4850,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
    detailImages: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'An expansive masterwork rendered with heavy impasto and delicate oil glazing, capturing the raw tension between twilight atmosphere and untamed sea spray.',
    story: 'Conceived during a three-week solitude residency on the coast of Maine. The layers of Prussian blue and burnt sienna were applied using handcrafted palette knives and sable brushes over seven months of drying periods.',
    framed: true,
    status: 'available',
    featured: true,
    paletteColors: ['#0E2A47', '#D97706', '#E2DDD5', '#C5A059'],
    weight: '14.2 lbs (6.4 kg)',
    varnishType: 'Dammar Satin Archival Varnish'
  },
  {
    id: 'art-02',
    title: 'Echoes of the Florentine Dusk',
    subtitle: 'Classical Portrait & Chiaroscuro Exploration',
    year: 2024,
    medium: 'Oil on Canvas',
    dimensions: '30 x 42 in (76 x 106 cm)',
    price: 3900,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1400&auto=format&fit=crop',
    detailImages: [
      'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=1200&auto=format&fit=crop'
    ],
    description: 'A deeply emotive exploration of human contemplation, illuminated by a single warm candle source reflecting Rembrandt-style chiaroscuro principles.',
    story: 'Created using hand-ground earth pigments mixed with cold-pressed linseed oil. The golden flesh tones emerge from deep umber shadows.',
    framed: true,
    status: 'available',
    featured: true,
    paletteColors: ['#3A1F1D', '#C5A059', '#E63946', '#F5E6CC'],
    weight: '10.5 lbs (4.8 kg)',
    varnishType: 'Gamvar Gloss Archival'
  },
  {
    id: 'art-03',
    title: 'Anatomy of Silence: No. IV',
    subtitle: 'Raw Vine Charcoal on Heavy Cotton Rag',
    year: 2025,
    medium: 'Charcoal & Graphite',
    dimensions: '28 x 38 in (71 x 96 cm)',
    price: 1950,
    image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=1400&auto=format&fit=crop',
    description: 'A study in high contrast and textural restraint, capturing the micro-tensions of the human back through powdered graphite and kneaded erasure.',
    story: 'Stripped of color to focus purely on structural rhythm, volume, and negative space. Finished on 640gsm handmade Fabriano cotton rag.',
    framed: true,
    status: 'available',
    featured: true,
    paletteColors: ['#1A1816', '#4A4A4A', '#8C8C8C', '#EAE6E1'],
    weight: '6.8 lbs (3.1 kg)',
    varnishType: 'SpectraFix Non-Toxic Natural Casein Fixative'
  },
  {
    id: 'art-04',
    title: 'Verdant Awakening: Spring Equinox',
    subtitle: 'Impasto Mineral Pigments & Pure Cobalt Glaze',
    year: 2024,
    medium: 'Acrylic & Mixed Media',
    dimensions: '48 x 60 in (122 x 152 cm)',
    price: 5600,
    image: 'https://images.unsplash.com/photo-1579783923665-35632f426dd8?q=80&w=1400&auto=format&fit=crop',
    description: 'A monumental canvas radiating botanical energy, thick sculptural knife strokes, and iridescent gold mica particles infused with emerald green.',
    story: 'Exhibited at the Chelsea Fine Art Pavilion in autumn 2024. A testament to nature’s relentless renewal and chromatic explosion.',
    framed: true,
    status: 'reserved',
    featured: false,
    paletteColors: ['#059669', '#10B981', '#C5A059', '#FDFBF7'],
    weight: '18.0 lbs (8.1 kg)',
    varnishType: 'Liquitex Professional High Gloss UV Varnish'
  },
  {
    id: 'art-05',
    title: 'Transient Morning Mist over Venice',
    subtitle: 'Wet-on-Wet Atmospheric Pigment Study',
    year: 2025,
    medium: 'Watercolor & Ink',
    dimensions: '22 x 30 in (56 x 76 cm)',
    price: 1450,
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?q=80&w=1400&auto=format&fit=crop',
    description: 'Delicate washes of French ultramarine and warm raw sienna capturing the romantic haze of the Venetian lagoon at 6:00 AM.',
    story: 'Painted en plein air from the steps of Santa Maria della Salute. The spontaneous blooms of watercolor create an ethereal dreamscape.',
    framed: true,
    status: 'available',
    featured: true,
    paletteColors: ['#2563EB', '#60A5FA', '#D97706', '#F3F4F6'],
    weight: '4.5 lbs (2.0 kg)',
    varnishType: 'UV Glass Protected Frame'
  },
  {
    id: 'art-06',
    title: 'The Alchemist’s Reverie',
    subtitle: 'Archival Giclée Print on Hahnemühle Photo Rag (Edition of 25)',
    year: 2025,
    medium: 'Limited Edition Print',
    dimensions: '24 x 36 in (61 x 91 cm)',
    price: 650,
    image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=1400&auto=format&fit=crop',
    description: 'Hand-signed, numbered, and embossed collector print reproduced with 12-channel Lucia PRO pigment inks, rated for 200+ years lightfastness.',
    story: 'The original was collected by an anonymous private museum in Zurich. This limited edition offers art enthusiasts an accessible heirloom piece.',
    framed: false,
    status: 'available',
    featured: false,
    paletteColors: ['#1A1816', '#E63946', '#C5A059', '#FDFBF7'],
    weight: '1.2 lbs (0.5 kg)',
    varnishType: 'Archival Hahnemühle Protective Spray'
  },
  {
    id: 'art-07',
    title: 'Whispers in Ochre & Rust',
    subtitle: 'Textural Heavy Mineral Paste & Raw Umber',
    year: 2024,
    medium: 'Oil on Canvas',
    dimensions: '36 x 36 in (91 x 91 cm)',
    price: 3400,
    image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=1400&auto=format&fit=crop',
    description: 'Sculptural layers of cracked marble dust paste blended with dark walnut oil, evoking ancient Mediterranean frescoes weathered by centuries.',
    story: 'A tribute to the passage of time and the beauty found in organic decay and patinas.',
    framed: true,
    status: 'sold',
    featured: false,
    paletteColors: ['#B45309', '#78350F', '#D97706', '#F5E6CC'],
    weight: '12.0 lbs (5.4 kg)',
    varnishType: 'Matte Wax Resin Finish'
  },
  {
    id: 'art-08',
    title: 'The Poet’s Monologue',
    subtitle: 'Conté Crayon & Compressed Willow Charcoal',
    year: 2025,
    medium: 'Charcoal & Graphite',
    dimensions: '20 x 28 in (51 x 71 cm)',
    price: 1600,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1400&auto=format&fit=crop',
    description: 'Dynamic gestural strokes depicting a figure caught in profound inner dialogue, balanced by crisp architectural guidelines.',
    story: 'Created during live masterclass demonstrations to teach students how to retain spontaneous gesture within anatomical fidelity.',
    framed: true,
    status: 'available',
    featured: false,
    paletteColors: ['#0F0E0D', '#3F3F46', '#D4D4D8', '#FFFFFF'],
    weight: '5.2 lbs (2.4 kg)',
    varnishType: 'Archival Fixative with Low Sheen'
  }
];

// Order Helpers
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(INITIAL_SEED_ORDERS, null, 2), 'utf-8');
      return INITIAL_SEED_ORDERS;
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders file:', err);
  }
}

// Artwork Helpers
function readArtworks() {
  try {
    if (!fs.existsSync(ARTWORKS_FILE)) {
      fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(INITIAL_SEED_ARTWORKS, null, 2), 'utf-8');
      return INITIAL_SEED_ARTWORKS;
    }
    const data = fs.readFileSync(ARTWORKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEED_ARTWORKS;
  } catch (err) {
    console.error('Error reading artworks file:', err);
    return INITIAL_SEED_ARTWORKS;
  }
}

function writeArtworks(artworks) {
  try {
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing artworks file:', err);
  }
}

// SSE Clients for Live Push Notifications
let sseClients = [];

function broadcastUpdate(type, payload) {
  const message = `data: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch (e) {
      // client disconnected
    }
  });
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  const orders = readOrders();
  const artworks = readArtworks();
  res.json({
    status: 'ok',
    service: 'Kuldeep Singh Fine Art Atelier API',
    timestamp: new Date().toISOString(),
    totalOrders: orders.length,
    totalArtworks: artworks.length
  });
});

// SSE Live Stream Endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// ==========================================
// ARTWORKS ENDPOINTS
// ==========================================

// GET all artworks
app.get('/api/artworks', (req, res) => {
  const artworks = readArtworks();
  res.json(artworks);
});

// GET single artwork by ID
app.get('/api/artworks/:id', (req, res) => {
  const artworks = readArtworks();
  const item = artworks.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Artwork not found' });
  }
  res.json(item);
});

// POST create new artwork
app.post('/api/artworks', (req, res) => {
  const body = req.body;
  const artworks = readArtworks();

  const newArtwork = {
    id: body.id || `art-${Date.now()}`,
    title: body.title || 'Untitled Artwork',
    subtitle: body.subtitle || '',
    year: body.year || new Date().getFullYear(),
    medium: body.medium || 'Oil on Canvas',
    dimensions: body.dimensions || '24 x 36 in',
    price: Number(body.price) || 1000,
    image: body.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
    detailImages: Array.isArray(body.detailImages) ? body.detailImages : [],
    description: body.description || '',
    story: body.story || '',
    framed: Boolean(body.framed),
    status: body.status || 'available',
    featured: Boolean(body.featured),
    paletteColors: Array.isArray(body.paletteColors) && body.paletteColors.length > 0 ? body.paletteColors : ['#0E2A47', '#C5A059', '#E2DDD5'],
    weight: body.weight || '5 kg',
    varnishType: body.varnishType || 'Archival Satin Varnish'
  };

  artworks.unshift(newArtwork);
  writeArtworks(artworks);

  broadcastUpdate('ARTWORK_CREATED', newArtwork);

  console.log(`[BACKEND] New Artwork Added: "${newArtwork.title}" (#${newArtwork.id}) - ₹${newArtwork.price}`);
  res.status(201).json({ success: true, artwork: newArtwork });
});

// PUT update artwork
app.put('/api/artworks/:id', (req, res) => {
  const artworks = readArtworks();
  const idx = artworks.findIndex((a) => a.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  const existing = artworks[idx];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id // preserve ID
  };

  artworks[idx] = updated;
  writeArtworks(artworks);

  broadcastUpdate('ARTWORK_UPDATED', updated);

  console.log(`[BACKEND] Artwork Updated: "${updated.title}" (#${updated.id})`);
  res.json({ success: true, artwork: updated });
});

// DELETE single artwork
app.delete('/api/artworks/:id', (req, res) => {
  const artworks = readArtworks();
  const filtered = artworks.filter((a) => a.id !== req.params.id);

  if (filtered.length === artworks.length) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  writeArtworks(filtered);
  broadcastUpdate('ARTWORK_DELETED', { id: req.params.id });

  console.log(`[BACKEND] Artwork Deleted: #${req.params.id}`);
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================

// GET all orders
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// GET single order by ID
app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// POST create new order
app.post('/api/orders', (req, res) => {
  const body = req.body;
  const orders = readOrders();

  const generatedId = body.id || ('ORD_' + Math.floor(10000 + Math.random() * 90000));
  const now = new Date();
  const dateStr = body.date || now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = body.orderTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const monthStr = body.orderMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const newOrder = {
    id: generatedId,
    customerName: body.customerName || 'Collector Guest',
    customerEmail: body.customerEmail || 'collector@kuldeepsingh.art',
    customerPhone: body.customerPhone || '+91 98000 00000',
    customerCity: body.customerCity || 'India',
    customerState: body.customerState || '',
    deliveryAddress: body.deliveryAddress || 'Standard Fine Art Insured Crating',
    paymentMethod: body.paymentMethod || 'Online Payment (Demo Gateway)',
    paymentStatus: body.paymentStatus || 'Paid',
    orderStatus: body.orderStatus || 'Order Placed',
    date: dateStr,
    orderTime: timeStr,
    orderMonth: monthStr,
    items: Array.isArray(body.items) ? body.items : [],
    subtotal: Number(body.subtotal) || Number(body.totalAmount) || 0,
    discount: Number(body.discount) || 0,
    shipping: Number(body.shipping) || 0,
    totalAmount: Number(body.totalAmount) || 0,
    currentStep: body.currentStep || 1,
    stepStatus: body.stepStatus || 'placed',
    trackingNumber: body.trackingNumber || '',
    carrierName: body.carrierName || 'BlueDart Express',
    notes: body.notes || '',
    stepTimestamps: body.stepTimestamps || {
      placed: `${timeStr}, ${dateStr}`
    }
  };

  orders.unshift(newOrder);
  writeOrders(orders);

  broadcastUpdate('ORDER_CREATED', newOrder);

  console.log(`[BACKEND] New Order Placed: #${newOrder.id} - ${newOrder.customerName} - ₹${newOrder.totalAmount}`);
  res.status(201).json({ success: true, order: newOrder });
});

// PUT update order
app.put('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const existing = orders[idx];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id // preserve ID
  };

  orders[idx] = updated;
  writeOrders(orders);

  broadcastUpdate('ORDER_UPDATED', updated);

  console.log(`[BACKEND] Order Updated: #${updated.id} - Step: ${updated.currentStep} (${updated.stepStatus})`);
  res.json({ success: true, order: updated });
});

// DELETE single order
app.delete('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const filtered = orders.filter((o) => o.id !== req.params.id);

  if (filtered.length === orders.length) {
    return res.status(404).json({ error: 'Order not found' });
  }

  writeOrders(filtered);
  broadcastUpdate('ORDER_DELETED', { id: req.params.id });

  console.log(`[BACKEND] Order Deleted: #${req.params.id}`);
  res.json({ success: true, id: req.params.id });
});

// DELETE all orders
app.delete('/api/orders', (req, res) => {
  writeOrders([]);
  broadcastUpdate('ORDERS_CLEARED', {});
  console.log(`[BACKEND] All Orders Cleared`);
  res.json({ success: true, message: 'All orders cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🎨 Artist Kuldeep Singh 24/7 Backend API & DB Online!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📦 Database Orders: ${ORDERS_FILE}`);
  console.log(`🖼️ Database Artworks: ${ARTWORKS_FILE}`);
  console.log(`====================================================`);
});
