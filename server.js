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
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample seed if database is clean
const INITIAL_SEED_ORDERS = [
  {
    id: 'ORD_00932',
    customerName: 'Rajesh & Sunita Oberoi',
    customerEmail: 'oberoi.residence@oberoigroup.com',
    customerPhone: '+91 99100 88231',
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
  res.json({
    status: 'ok',
    service: 'Kuldeep Singh Fine Art Atelier API',
    timestamp: new Date().toISOString(),
    totalOrders: orders.length
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
  console.log(`📦 Database: ${ORDERS_FILE}`);
  console.log(`====================================================`);
});
