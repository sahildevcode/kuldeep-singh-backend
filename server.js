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
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const LIVE_STATUS_FILE = path.join(DATA_DIR, 'live_status.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// SEED DATA
// -------------------------------------------------------------

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
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
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

const INITIAL_SEED_STUDENTS = [
  {
    id: 'stu-101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '+91 98201 45892',
    courseId: 'course-oil-mastery',
    courseTitle: 'The Master Oil Painting Diploma',
    batchSchedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: 'Sep 1, 2026',
    feesPaid: 349,
    paymentStatus: 'Paid',
    progressPercent: 68,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-102',
    name: 'Elena Rostova',
    email: 'elena.rostova@artacademy.eu',
    phone: '+44 7700 900077',
    courseId: 'course-realistic-sketching',
    courseTitle: 'Foundations of Realistic Sketching & Human Anatomy',
    batchSchedule: 'Tuesday & Thursday • 7:00 PM – 9:00 PM IST',
    enrolledDate: 'Sep 3, 2026',
    feesPaid: 249,
    paymentStatus: 'Paid',
    progressPercent: 42,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-103',
    name: 'Dev Patel',
    email: 'dev.patel.design@outlook.com',
    phone: '+91 98112 33455',
    courseId: 'course-watercolor-fluid',
    courseTitle: 'Expressive Watercolor & Fluid Pigment Painting',
    batchSchedule: 'Wednesday & Friday • 6:30 PM – 8:30 PM IST',
    enrolledDate: 'Aug 28, 2026',
    feesPaid: 219,
    paymentStatus: 'Paid',
    progressPercent: 85,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-104',
    name: 'Sophia Laurent',
    email: 'sophia.l@parisart.fr',
    phone: '+33 6 12 34 56 78',
    courseId: 'course-oil-mastery',
    courseTitle: 'The Master Oil Painting Diploma',
    batchSchedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: 'Sep 5, 2026',
    feesPaid: 349,
    paymentStatus: 'Paid',
    progressPercent: 20,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
  }
];

const INITIAL_SEED_COURSES = [
  {
    id: 'course-oil-mastery',
    title: 'The Master Oil Painting Diploma',
    subtitle: 'From Blank Belgian Canvas to Classical Realism, Glazes & Expressive Impasto',
    level: 'All Levels',
    category: 'Oil Painting',
    durationHours: 36,
    durationMonths: '3 Months Intensive Masterclass',
    schedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST (Live Atelier + 4K Recordings)',
    startDate: 'Next Cohort: 1st of Upcoming Month',
    mode: 'Live Studio Workshop + 1-on-1 Personal Critique by Kuldeep Singh',
    certification: 'Master of Classical Oils Certificate signed by Artist Kuldeep Singh',
    prerequisites: 'No prior oil painting experience needed; passion for classical fine art is required.',
    totalLessons: 48,
    price: 349,
    originalPrice: 499,
    rating: 4.96,
    studentsEnrolled: 2480,
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    summary: 'A 3-month comprehensive diploma covering classical Old Masters glazing, fat-over-lean chemical rules, portrait flesh tones, and bold sculptural impasto.',
    liveClassStatus: 'offline',
    liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
    modules: [
      {
        id: 'mod-1',
        title: 'Month 1: Studio Setup, Pigment Chemistry & Underpainting',
        duration: '12 Hours (Weeks 1 – 4)',
        lessonsCount: 4,
        topics: [
          'Week 1: Non-toxic studio safety, oils, solvents, and medium recipes',
          'Week 2: Stretching linen, sizing with rabbit skin glue, and applying oil ground',
          'Week 3: Sight-size proportions and Imprimatura tonal washes',
          'Week 4: Grisaille monochrome study — establishing indestructible value structure'
        ],
        lectures: [
          {
            id: 'lec-oil-1',
            title: 'Week 1: Non-toxic studio safety, oils, solvents, and medium recipes',
            duration: '48 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Comprehensive workshop on proper ventilation, cold-pressed linseed oil chemistry, and archival dammar preparations.'
          },
          {
            id: 'lec-oil-2',
            title: 'Week 2: Stretching linen, sizing with rabbit skin glue, and applying oil ground',
            duration: '52 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Master practical demonstration on traditional Belgian linen preparation.'
          },
          {
            id: 'lec-oil-3',
            title: 'Week 3: Sight-size proportions and Imprimatura tonal washes',
            duration: '45 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Laying down the warm raw umber ground and blocking primary anatomical planes.'
          },
          {
            id: 'lec-oil-4',
            title: 'Week 4: Grisaille monochrome study — value structure',
            duration: '60 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Executing a monochrome chiaroscuro study before introducing chromatic glazes.'
          }
        ]
      },
      {
        id: 'mod-2',
        title: 'Month 2: Alla Prima, Heavy Impasto & Color Temperatures',
        duration: '12 Hours (Weeks 5 – 8)',
        lessonsCount: 2,
        topics: [
          'Week 5: Direct painting speed & spontaneous brush calligraphy',
          'Week 6: Palette knife sculpting — layering thick mineral paste'
        ],
        lectures: [
          {
            id: 'lec-oil-5',
            title: 'Week 5: Direct painting speed & spontaneous brush calligraphy',
            duration: '50 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Wet-on-wet expressive oil painting techniques.'
          },
          {
            id: 'lec-oil-6',
            title: 'Week 6: Palette knife sculpting — layering thick mineral paste',
            duration: '55 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Creating sculpted textural surfaces that catch dimensional light.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-realistic-sketching',
    title: 'Foundations of Realistic Sketching & Human Anatomy',
    subtitle: 'Master Sight-Size Measuring, 5-Value Light & Shadow, Willow Charcoal, and Figure Drawing',
    level: 'All Levels',
    category: 'Realistic Sketching',
    durationHours: 26,
    durationMonths: '2 Months Comprehensive Foundation',
    schedule: 'Tuesday & Thursday • 7:00 PM – 9:00 PM IST (Live Step-by-Step Demos)',
    startDate: 'Next Cohort: 10th of Upcoming Month',
    mode: 'Live Anatomy Drawing Classes + Weekly Homework Review',
    certification: 'Academic Draftsmanship Certificate by Artist Kuldeep Singh',
    prerequisites: 'Open to beginners and self-taught sketchers wanting academic precision.',
    totalLessons: 36,
    price: 249,
    originalPrice: 349,
    rating: 4.98,
    studentsEnrolled: 3820,
    thumbnail: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=1200&auto=format&fit=crop',
    summary: 'A 2-month rigorous foundation in seeing like a draftsman. Master graphite pressures, willow charcoal sculpting, human bone landmarks, and photographic realism.',
    liveClassStatus: 'offline',
    liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
    modules: [
      {
        id: 'mod-s1',
        title: 'Month 1: The Draftsman’s Eye, Line Dynamics & Form Lighting',
        duration: '13 Hours (Weeks 1 – 4)',
        lessonsCount: 2,
        topics: ['Week 1: Pencil grip ergonomics', 'Week 2: The 5-Value tonal scale'],
        lectures: [
          {
            id: 'lec-sk-1',
            title: 'Week 1: Pencil grip ergonomics & fine mechanical control',
            duration: '42 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Loose gestural arm movement vs wrist precision.'
          },
          {
            id: 'lec-sk-2',
            title: 'Week 2: The 5-Value tonal scale on geometric solids',
            duration: '47 Mins',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            summary: 'Understanding center light, core shadow, and ambient occlusion.'
          }
        ]
      }
    ]
  }
];

const INITIAL_LIVE_STATUS = {
  isLive: false,
  liveStreamUrl: 'https://meet.google.com/ks-studio-atelier',
  topic: 'Masterclass Live Studio Broadcast • Atelier Demonstration',
  updatedAt: new Date().toISOString()
};

// -------------------------------------------------------------
// READ / WRITE HELPERS
// -------------------------------------------------------------

function readJsonFile(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
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
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const liveStatus = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);

  res.json({
    status: 'ok',
    service: 'Kuldeep Singh Fine Art Atelier Cloud API',
    timestamp: new Date().toISOString(),
    totalOrders: orders.length,
    totalArtworks: artworks.length,
    totalCourses: courses.length,
    totalStudents: students.length,
    isLive: liveStatus.isLive
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

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// ==========================================
// 1. LIVE STUDIO BROADCAST API
// ==========================================

app.get('/api/live', (req, res) => {
  const liveStatus = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
  res.json(liveStatus);
});

app.post('/api/live', (req, res) => {
  const current = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
  const updated = {
    ...current,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeJsonFile(LIVE_STATUS_FILE, updated);

  // Also update courses[0] liveClassStatus
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  if (courses.length > 0) {
    courses[0].liveClassStatus = updated.isLive ? 'live' : 'offline';
    if (updated.liveStreamUrl) {
      courses[0].liveClassUrl = updated.liveStreamUrl;
    }
    writeJsonFile(COURSES_FILE, courses);
  }

  broadcastUpdate('LIVE_STATUS_CHANGED', updated);
  console.log(`[BACKEND] Live Broadcast Status Changed: ${updated.isLive ? '🔴 LIVE' : '⚪ OFFLINE'} - URL: ${updated.liveStreamUrl}`);
  res.json({ success: true, liveStatus: updated });
});

// ==========================================
// 2. COURSES & LECTURES API (200GB Video / Stream Ready)
// ==========================================

app.get('/api/courses', (req, res) => {
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// Add / Upload New Lecture into Course Module
app.post('/api/courses/:id/modules/:moduleIndex/lectures', (req, res) => {
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const modIdx = parseInt(req.params.moduleIndex, 10);
  if (!course.modules || !course.modules[modIdx]) {
    return res.status(404).json({ error: 'Module not found' });
  }

  const newLecture = {
    id: req.body.id || `lec-${Date.now()}`,
    title: req.body.title || 'Untitled Master Lecture',
    duration: req.body.duration || '45 Mins',
    videoUrl: req.body.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary: req.body.summary || 'Master practical demonstration by Artist Kuldeep Singh.'
  };

  if (!course.modules[modIdx].lectures) {
    course.modules[modIdx].lectures = [];
  }

  course.modules[modIdx].lectures.push(newLecture);
  course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;

  writeJsonFile(COURSES_FILE, courses);
  broadcastUpdate('LECTURE_ADDED', { courseId: course.id, moduleIndex: modIdx, lecture: newLecture });

  console.log(`[BACKEND] New Lecture Added to "${course.title}": "${newLecture.title}"`);
  res.status(201).json({ success: true, lecture: newLecture, course });
});

// Update Course
app.put('/api/courses/:id', (req, res) => {
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const idx = courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Course not found' });

  courses[idx] = { ...courses[idx], ...req.body, id: courses[idx].id };
  writeJsonFile(COURSES_FILE, courses);
  broadcastUpdate('COURSE_UPDATED', courses[idx]);
  res.json({ success: true, course: courses[idx] });
});

// ==========================================
// 3. STUDENTS & ENROLLMENTS API
// ==========================================

app.get('/api/students', (req, res) => {
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const newStudent = {
    id: req.body.id || `stu-${Date.now()}`,
    name: req.body.name || 'Student Artist',
    email: req.body.email || 'student@kuldeepsingh.art',
    phone: req.body.phone || '',
    courseId: req.body.courseId || 'course-oil-mastery',
    courseTitle: req.body.courseTitle || 'The Master Oil Painting Diploma',
    batchSchedule: req.body.batchSchedule || 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: req.body.enrolledDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    feesPaid: Number(req.body.feesPaid) || 349,
    paymentStatus: req.body.paymentStatus || 'Paid',
    progressPercent: Number(req.body.progressPercent) || 0,
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  };

  students.unshift(newStudent);
  writeJsonFile(STUDENTS_FILE, students);
  broadcastUpdate('STUDENT_ENROLLED', newStudent);

  console.log(`[BACKEND] New Student Enrolled: ${newStudent.name} (${newStudent.courseTitle})`);
  res.status(201).json({ success: true, student: newStudent });
});

app.put('/api/students/:id', (req, res) => {
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const idx = students.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });

  students[idx] = { ...students[idx], ...req.body, id: students[idx].id };
  writeJsonFile(STUDENTS_FILE, students);
  broadcastUpdate('STUDENT_UPDATED', students[idx]);
  res.json({ success: true, student: students[idx] });
});

app.delete('/api/students/:id', (req, res) => {
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const filtered = students.filter((s) => s.id !== req.params.id);
  writeJsonFile(STUDENTS_FILE, filtered);
  broadcastUpdate('STUDENT_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// 4. ARTWORKS API
// ==========================================

app.get('/api/artworks', (req, res) => {
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  res.json(artworks);
});

app.get('/api/artworks/:id', (req, res) => {
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const item = artworks.find((a) => a.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Artwork not found' });
  res.json(item);
});

app.post('/api/artworks', (req, res) => {
  const body = req.body;
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);

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
  writeJsonFile(ARTWORKS_FILE, artworks);
  broadcastUpdate('ARTWORK_CREATED', newArtwork);

  console.log(`[BACKEND] New Artwork Added: "${newArtwork.title}" (#${newArtwork.id}) - ₹${newArtwork.price}`);
  res.status(201).json({ success: true, artwork: newArtwork });
});

app.put('/api/artworks/:id', (req, res) => {
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const idx = artworks.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Artwork not found' });

  artworks[idx] = { ...artworks[idx], ...req.body, id: artworks[idx].id };
  writeJsonFile(ARTWORKS_FILE, artworks);
  broadcastUpdate('ARTWORK_UPDATED', artworks[idx]);
  res.json({ success: true, artwork: artworks[idx] });
});

app.delete('/api/artworks/:id', (req, res) => {
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const filtered = artworks.filter((a) => a.id !== req.params.id);
  writeJsonFile(ARTWORKS_FILE, filtered);
  broadcastUpdate('ARTWORK_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// 5. ORDERS API
// ==========================================

app.get('/api/orders', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const body = req.body;
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);

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
  writeJsonFile(ORDERS_FILE, orders);
  broadcastUpdate('ORDER_CREATED', newOrder);

  console.log(`[BACKEND] New Order Placed: #${newOrder.id} - ${newOrder.customerName} - ₹${newOrder.totalAmount}`);
  res.status(201).json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });

  orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id };
  writeJsonFile(ORDERS_FILE, orders);
  broadcastUpdate('ORDER_UPDATED', orders[idx]);
  res.json({ success: true, order: orders[idx] });
});

app.delete('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const filtered = orders.filter((o) => o.id !== req.params.id);
  writeJsonFile(ORDERS_FILE, filtered);
  broadcastUpdate('ORDER_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

app.delete('/api/orders', (req, res) => {
  writeJsonFile(ORDERS_FILE, []);
  broadcastUpdate('ORDERS_CLEARED', {});
  res.json({ success: true, message: 'All orders cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🎨 Artist Kuldeep Singh 24/7 Complete Cloud API Online!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📦 Database: ${DATA_DIR}`);
  console.log(`====================================================`);
});
