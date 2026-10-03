import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import multer from 'multer';

// Force public DNS resolution to prevent local ISP SRV resolution issues
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sahilytzxx_db_user:m4J2c1FkGupWeQVa@cluster0.xr4tur3.mongodb.net/kuldeep_studio?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ARTWORKS_FILE = path.join(DATA_DIR, 'artworks.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const LIVE_STATUS_FILE = path.join(DATA_DIR, 'live_status.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

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
    carrierName: 'BlueDart Express',
    notes: 'Fragile archival fine art crating',
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

const INITIAL_ARTIST_PROFILE = {
  id: 'primary_profile',
  name: 'Kuldeep Singh',
  title: 'Master Classical Realist & Atelier Founder',
  studioVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  studioVideoTitle: 'Artist Kuldeep Singh • Master Oil Painting in Atelier',
  studioVideoPoster: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
  bio: 'Dedicated to the timeless traditions of European academic realism, anatomical draftsmanship, and fine art mastery.',
  yearsOfExperience: 18,
  exhibitionsCount: 24,
  privateCollectorsCount: 350,
  awardsCount: 12
};

// -------------------------------------------------------------
// READ / WRITE FILE HELPERS (Resilient Fallback & Local Backup)
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

// -------------------------------------------------------------
// MONGOOSE SCHEMAS & MODELS (Flexible Schema - Preserves All Fields)
// -------------------------------------------------------------

const OrderSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerCity: String,
  customerState: String,
  deliveryAddress: String,
  paymentMethod: String,
  paymentStatus: String,
  orderStatus: String,
  date: String,
  orderTime: String,
  orderMonth: String,
  items: Array,
  subtotal: Number,
  discount: Number,
  shipping: Number,
  totalAmount: Number,
  currentStep: Number,
  stepStatus: String,
  trackingNumber: String,
  carrierName: String,
  notes: String,
  stepTimestamps: Object
}, { timestamps: true, strict: false });

const ArtworkSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: String,
  subtitle: String,
  year: Number,
  medium: String,
  dimensions: String,
  price: Number,
  image: String,
  detailImages: Array,
  description: String,
  story: String,
  framed: Boolean,
  status: String,
  featured: Boolean,
  paletteColors: Array,
  weight: String,
  varnishType: String
}, { timestamps: true, strict: false });

const CourseSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: String,
  subtitle: String,
  level: String,
  category: String,
  durationHours: Number,
  durationMonths: String,
  schedule: String,
  startDate: String,
  mode: String,
  certification: String,
  totalLessons: Number,
  price: Number,
  originalPrice: Number,
  rating: Number,
  studentsEnrolled: Number,
  thumbnail: String,
  summary: String,
  description: String,
  whatYouWillLearn: Array,
  materialsNeeded: Array,
  modules: Array,
  liveClassUrl: String,
  liveClassStatus: String
}, { timestamps: true, strict: false });

const StudentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  email: String,
  phone: String,
  courseId: String,
  courseTitle: String,
  batchSchedule: String,
  enrolledDate: String,
  feesPaid: Number,
  paymentStatus: String,
  progressPercent: Number,
  avatar: String
}, { timestamps: true, strict: false });

const LiveStatusSchema = new mongoose.Schema({
  isLive: Boolean,
  liveStreamUrl: String,
  topic: String,
  updatedAt: String
}, { timestamps: true, strict: false });

const ProfileSchema = new mongoose.Schema({
  id: { type: String, default: 'primary_profile', unique: true },
  name: String,
  title: String,
  studioVideoUrl: String,
  studioVideoTitle: String,
  studioVideoPoster: String,
  bio: String,
  yearsOfExperience: Number,
  exhibitionsCount: Number,
  privateCollectorsCount: Number,
  awardsCount: Number
}, { timestamps: true, strict: false });

const ActiveSessionSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  deviceId: { type: String, required: true },
  courseId: String,
  lastHeartbeat: { type: Date, default: Date.now }
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);
const ArtworkModel = mongoose.model('Artwork', ArtworkSchema);
const CourseModel = mongoose.model('Course', CourseSchema);
const StudentModel = mongoose.model('Student', StudentSchema);
const LiveStatusModel = mongoose.model('LiveStatus', LiveStatusSchema);
const ProfileModel = mongoose.model('Profile', ProfileSchema);
const ActiveSessionModel = mongoose.model('ActiveSession', ActiveSessionSchema);

let isMongoConnected = false;

async function initMongoDB() {
  try {
    console.log('[BACKEND] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    isMongoConnected = true;
    console.log('✅ [BACKEND] MongoDB Atlas Cloud Database connected successfully!');

    // Auto-seed Artworks if collection is empty
    const artCount = await ArtworkModel.countDocuments();
    if (artCount === 0) {
      const existingArt = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
      await ArtworkModel.insertMany(existingArt);
      console.log(`[BACKEND] Seeded ${existingArt.length} artworks into MongoDB Atlas`);
    }

    // Auto-seed Courses if collection is empty
    const courseCount = await CourseModel.countDocuments();
    if (courseCount === 0) {
      const existingCourses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
      await CourseModel.insertMany(existingCourses);
      console.log(`[BACKEND] Seeded ${existingCourses.length} courses into MongoDB Atlas`);
    }

    // Auto-seed Students if collection is empty
    const studentCount = await StudentModel.countDocuments();
    if (studentCount === 0) {
      const existingStudents = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
      if (existingStudents.length > 0) {
        await StudentModel.insertMany(existingStudents);
        console.log(`[BACKEND] Seeded ${existingStudents.length} students into MongoDB Atlas`);
      }
    }

    // Auto-seed Orders if collection is empty
    const orderCount = await OrderModel.countDocuments();
    if (orderCount === 0) {
      const existingOrders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
      if (existingOrders.length > 0) {
        await OrderModel.insertMany(existingOrders);
        console.log(`[BACKEND] Seeded ${existingOrders.length} orders into MongoDB Atlas`);
      }
    }

    // Auto-seed LiveStatus if collection is empty
    const liveCount = await LiveStatusModel.countDocuments();
    if (liveCount === 0) {
      const existingLive = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
      await LiveStatusModel.create(existingLive);
    }

    // Auto-seed Profile if collection is empty
    const profileCount = await ProfileModel.countDocuments();
    if (profileCount === 0) {
      const existingProfile = readJsonFile(PROFILE_FILE, INITIAL_ARTIST_PROFILE);
      await ProfileModel.create(existingProfile);
      console.log('[BACKEND] Seeded Artist Profile into MongoDB Atlas');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ [BACKEND] MongoDB Atlas connection warning:', err.message);
    console.warn('⚠️ [BACKEND] Server is running in resilient local JSON mode.');
  }
}

initMongoDB();

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
app.get('/api/health', async (req, res) => {
  let orderCount = 0;
  let artCount = 0;
  let courseCount = 0;
  let studentCount = 0;
  let isLive = false;

  try {
    if (mongoose.connection.readyState === 1) {
      orderCount = await OrderModel.countDocuments();
      artCount = await ArtworkModel.countDocuments();
      courseCount = await CourseModel.countDocuments();
      studentCount = await StudentModel.countDocuments();
      const live = await LiveStatusModel.findOne().lean();
      isLive = live ? live.isLive : false;
    } else {
      const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
      const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
      const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
      const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
      const liveStatus = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
      orderCount = orders.length;
      artCount = artworks.length;
      courseCount = courses.length;
      studentCount = students.length;
      isLive = liveStatus.isLive;
    }
  } catch (err) {
    console.error('Health check count error:', err);
  }

  res.json({
    status: 'ok',
    service: 'Kuldeep Singh Fine Art Atelier Cloud API',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas (Connected)' : 'Local File Backup Mode',
    timestamp: new Date().toISOString(),
    totalOrders: orderCount,
    totalArtworks: artCount,
    totalCourses: courseCount,
    totalStudents: studentCount,
    isLive: isLive
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

app.get('/api/live', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const status = await LiveStatusModel.findOne().lean();
      if (status) return res.json(status);
    }
  } catch (e) {
    console.error('Mongo live get error:', e);
  }
  const liveStatus = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
  res.json(liveStatus);
});

app.post('/api/live', async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      const current = await LiveStatusModel.findOne().lean() || INITIAL_LIVE_STATUS;
      updated = {
        ...current,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      await LiveStatusModel.findOneAndUpdate({}, updated, { upsert: true, new: true });
    }
  } catch (e) {
    console.error('Mongo live post error:', e);
  }

  if (!updated) {
    const current = readJsonFile(LIVE_STATUS_FILE, INITIAL_LIVE_STATUS);
    updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
  }

  writeJsonFile(LIVE_STATUS_FILE, updated);

  // Update courses[0] liveClassStatus
  try {
    if (mongoose.connection.readyState === 1) {
      await CourseModel.updateOne(
        {},
        {
          liveClassStatus: updated.isLive ? 'live' : 'offline',
          ...(updated.liveStreamUrl ? { liveClassUrl: updated.liveStreamUrl } : {})
        }
      );
    }
  } catch (e) {}

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
// 1B. SINGLE-DEVICE CONCURRENT SESSION ENFORCEMENT API
// ==========================================

// In-Memory Fast Cache for Active Sessions (Device Locking)
const activeSessionsCache = new Map(); // email -> { deviceId, courseId, lastHeartbeat: number }

// Session Heartbeat - Checks & Enforces Single Device Concurrent Access
app.post('/api/session/heartbeat', async (req, res) => {
  const { email, deviceId, courseId, forceTakeover } = req.body;
  if (!email || !deviceId) {
    return res.status(400).json({ error: 'email and deviceId are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const SESSION_TIMEOUT_MS = 12000; // 12 seconds inactivity timeout

  // 1. Check in-memory cache first for sub-millisecond response
  let cached = activeSessionsCache.get(cleanEmail);

  // If not in cache, check MongoDB Atlas
  if (!cached && mongoose.connection.readyState === 1) {
    try {
      const doc = await ActiveSessionModel.findOne({ email: cleanEmail }).lean();
      if (doc) {
        cached = {
          deviceId: doc.deviceId,
          courseId: doc.courseId,
          lastHeartbeat: new Date(doc.lastHeartbeat).getTime()
        };
        activeSessionsCache.set(cleanEmail, cached);
      }
    } catch (err) {
      console.warn('Active session mongo check error:', err.message);
    }
  }

  // Case A: No previous active session exists -> Grant access!
  if (!cached) {
    const newSession = { deviceId, courseId: courseId || '', lastHeartbeat: now };
    activeSessionsCache.set(cleanEmail, newSession);

    if (mongoose.connection.readyState === 1) {
      ActiveSessionModel.findOneAndUpdate(
        { email: cleanEmail },
        { email: cleanEmail, deviceId, courseId, lastHeartbeat: new Date(now) },
        { upsert: true }
      ).catch(() => {});
    }

    return res.json({ allowed: true, deviceId, active: true });
  }

  // Case B: Same device continuing playback / browsing -> Refresh heartbeat!
  if (cached.deviceId === deviceId) {
    cached.lastHeartbeat = now;
    if (courseId) cached.courseId = courseId;
    activeSessionsCache.set(cleanEmail, cached);

    // Persist to mongo periodically (fire-and-forget)
    if (mongoose.connection.readyState === 1) {
      ActiveSessionModel.updateOne(
        { email: cleanEmail },
        { lastHeartbeat: new Date(now), ...(courseId ? { courseId } : {}) }
      ).catch(() => {});
    }

    return res.json({ allowed: true, deviceId, active: true });
  }

  // Case C: DIFFERENT deviceId trying to access!
  const timeSinceLastHeartbeat = now - cached.lastHeartbeat;

  // If older device hasn't pinged in > 12 seconds, or if user explicitly requested forceTakeover:
  if (timeSinceLastHeartbeat > SESSION_TIMEOUT_MS || forceTakeover === true) {
    console.log(`[SESSION] Device takeover for ${cleanEmail}: ${cached.deviceId} -> ${deviceId}`);
    cached.deviceId = deviceId;
    cached.lastHeartbeat = now;
    if (courseId) cached.courseId = courseId;
    activeSessionsCache.set(cleanEmail, cached);

    if (mongoose.connection.readyState === 1) {
      ActiveSessionModel.findOneAndUpdate(
        { email: cleanEmail },
        { email: cleanEmail, deviceId, courseId, lastHeartbeat: new Date(now) },
        { upsert: true }
      ).catch(() => {});
    }

    return res.json({ allowed: true, deviceId, active: true, takeover: true });
  }

  // Older device is actively watching (sent heartbeat within last 12 seconds)!
  const secondsAgo = Math.max(1, Math.round(timeSinceLastHeartbeat / 1000));
  return res.json({
    allowed: false,
    activeDeviceId: cached.deviceId,
    secondsSinceLastActive: secondsAgo,
    message: 'Active Session Detected: Aapka account kisi doosre device ya browser tab par live dekh raha hai. Ek samay par sirf 1 device allowed hai.'
  });
});

// Force Session Takeover endpoint
app.post('/api/session/takeover', async (req, res) => {
  const { email, deviceId, courseId } = req.body;
  if (!email || !deviceId) {
    return res.status(400).json({ error: 'email and deviceId are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();

  activeSessionsCache.set(cleanEmail, { deviceId, courseId: courseId || '', lastHeartbeat: now });

  if (mongoose.connection.readyState === 1) {
    try {
      await ActiveSessionModel.findOneAndUpdate(
        { email: cleanEmail },
        { email: cleanEmail, deviceId, courseId, lastHeartbeat: new Date(now) },
        { upsert: true }
      );
    } catch (e) {}
  }

  console.log(`[SESSION] Forced takeover granted to device "${deviceId}" for ${cleanEmail}`);
  res.json({ success: true, allowed: true, deviceId });
});

// Logout session endpoint
app.post('/api/session/logout', async (req, res) => {
  const { email, deviceId } = req.body;
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const cached = activeSessionsCache.get(cleanEmail);
    if (!deviceId || (cached && cached.deviceId === deviceId)) {
      activeSessionsCache.delete(cleanEmail);
      if (mongoose.connection.readyState === 1) {
        try {
          await ActiveSessionModel.deleteOne({ email: cleanEmail });
        } catch (e) {}
      }
    }
  }
  res.json({ success: true, message: 'Session cleared' });
});

// ==========================================
// 2. COURSES & LECTURES API
// ==========================================

app.get('/api/courses', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise().catch(() => {});
    }
    if (mongoose.connection.readyState === 1) {
      const courses = await CourseModel.find().lean();
      if (Array.isArray(courses)) return res.json(courses);
    }
  } catch (e) {
    console.error('Mongo courses get error:', e);
  }
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  res.json(courses);
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await CourseModel.findOne({ id: req.params.id }).lean();
      if (course) return res.json(course);
    }
  } catch (e) {
    console.error('Mongo course get error:', e);
  }
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// Add / Upload New Lecture into Course Module
app.post('/api/courses/:id/modules/:moduleIndex/lectures', async (req, res) => {
  const modIdx = parseInt(req.params.moduleIndex, 10);
  const newLecture = {
    id: req.body.id || `lec-${Date.now()}`,
    title: req.body.title || 'Untitled Master Lecture',
    duration: req.body.duration || '45 Mins',
    videoUrl: req.body.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary: req.body.summary || 'Master practical demonstration by Artist Kuldeep Singh.'
  };

  let updatedCourse;

  try {
    if (mongoose.connection.readyState === 1) {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course && course.modules && course.modules[modIdx]) {
        if (!course.modules[modIdx].lectures) {
          course.modules[modIdx].lectures = [];
        }
        course.modules[modIdx].lectures.push(newLecture);
        course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;
        if (!course.modules[modIdx].topics) course.modules[modIdx].topics = [];
        course.modules[modIdx].topics.push(newLecture.title);

        course.markModified('modules');
        await course.save();
        updatedCourse = course.toObject();
      }
    }
  } catch (e) {
    console.error('Mongo lecture add error:', e);
  }

  // Backup to file
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const course = courses.find((c) => c.id === req.params.id);
  if (course && course.modules && course.modules[modIdx]) {
    if (!course.modules[modIdx].lectures) course.modules[modIdx].lectures = [];
    course.modules[modIdx].lectures.push(newLecture);
    course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;
    writeJsonFile(COURSES_FILE, courses);
    if (!updatedCourse) updatedCourse = course;
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course or module not found' });

  broadcastUpdate('LECTURE_ADDED', { courseId: updatedCourse.id, moduleIndex: modIdx, lecture: newLecture });
  console.log(`[BACKEND] New Lecture Added to "${updatedCourse.title}": "${newLecture.title}"`);
  res.status(201).json({ success: true, lecture: newLecture, course: updatedCourse });
});

// Delete Lecture from Course Module
app.delete('/api/courses/:id/modules/:moduleIndex/lectures/:lectureIndex', async (req, res) => {
  const modIdx = parseInt(req.params.moduleIndex, 10);
  const lecIdx = parseInt(req.params.lectureIndex, 10);
  let updatedCourse;

  try {
    if (mongoose.connection.readyState === 1) {
      const course = await CourseModel.findOne({ id: req.params.id });
      if (course && course.modules && course.modules[modIdx] && course.modules[modIdx].lectures) {
        course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((_, idx) => idx !== lecIdx);
        course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;
        course.modules[modIdx].topics = course.modules[modIdx].lectures.map((l) => l.title);
        const total = course.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
        course.totalLessons = total;

        course.markModified('modules');
        await course.save();
        updatedCourse = course.toObject();
      }
    }
  } catch (e) {
    console.error('Mongo lecture delete error:', e);
  }

  // Backup to file
  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const course = courses.find((c) => c.id === req.params.id);
  if (course && course.modules && course.modules[modIdx] && course.modules[modIdx].lectures) {
    course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((_, idx) => idx !== lecIdx);
    course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;
    course.modules[modIdx].topics = course.modules[modIdx].lectures.map((l) => l.title);
    const total = course.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
    course.totalLessons = total;
    writeJsonFile(COURSES_FILE, courses);
    if (!updatedCourse) updatedCourse = course;
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course or lecture not found' });

  broadcastUpdate('LECTURE_DELETED', { courseId: updatedCourse.id, moduleIndex: modIdx, lectureIndex: lecIdx });
  res.json({ success: true, course: updatedCourse });
});

// Create New Course / Live Batch
app.post('/api/courses', async (req, res) => {
  const newCourse = {
    id: req.body.id || `course-${Date.now()}`,
    title: req.body.title || 'Untitled Masterclass Live Batch',
    subtitle: req.body.subtitle || 'Direct Atelier Mentorship Batch',
    level: req.body.level || 'All Levels',
    category: req.body.category || 'Oil Painting',
    durationHours: Number(req.body.durationHours) || 40,
    durationMonths: req.body.durationMonths || '1 Month',
    schedule: req.body.schedule || 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    startDate: req.body.startDate || '22 Oct, 2026',
    mode: req.body.mode || 'Live Atelier Stream + Recorded Archives',
    certification: req.body.certification || 'Kuldeep Singh Fine Art Master Diploma',
    totalLessons: Number(req.body.totalLessons) || 12,
    price: Number(req.body.price) || 9999,
    originalPrice: Number(req.body.originalPrice) || 14999,
    rating: 5.0,
    studentsEnrolled: 0,
    thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
    summary: req.body.summary || 'Live interactive masterclass with Artist Kuldeep Singh.',
    description: req.body.description || req.body.summary || '',
    whatYouWillLearn: req.body.whatYouWillLearn || ['Live Demonstration', 'Sight-Size Drawing', 'Master Glazing'],
    materialsNeeded: req.body.materialsNeeded || ['Palette knives', 'Linseed oil', 'Artist grade pigments'],
    modules: req.body.modules || [
      {
        id: `mod-${Date.now()}-1`,
        title: 'Module 1: Foundations & Live Orientation',
        duration: '2 Weeks',
        lessonsCount: 0,
        topics: [],
        lectures: []
      }
    ],
    liveClassUrl: req.body.liveClassUrl || 'https://meet.google.com/ks-studio-atelier',
    liveClassStatus: req.body.liveClassStatus || 'offline',
    ...req.body
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await CourseModel.findOneAndUpdate({ id: newCourse.id }, newCourse, { upsert: true });
    }
  } catch (e) {
    console.error('Mongo course create error:', e);
  }

  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  courses.unshift(newCourse);
  writeJsonFile(COURSES_FILE, courses);

  broadcastUpdate('COURSE_ADDED', newCourse);
  console.log(`[BACKEND] New Course Created: "${newCourse.title}" (#${newCourse.id})`);
  res.status(201).json({ success: true, course: newCourse });
});

// Update Course
app.put('/api/courses/:id', async (req, res) => {
  let updatedCourse;
  try {
    if (mongoose.connection.readyState === 1) {
      updatedCourse = await CourseModel.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body, id: req.params.id },
        { new: true, upsert: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo course update error:', e);
  }

  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const idx = courses.findIndex((c) => c.id === req.params.id);
  if (idx !== -1) {
    courses[idx] = { ...courses[idx], ...req.body, id: courses[idx].id };
    writeJsonFile(COURSES_FILE, courses);
    if (!updatedCourse) updatedCourse = courses[idx];
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

  broadcastUpdate('COURSE_UPDATED', updatedCourse);
  res.json({ success: true, course: updatedCourse });
});

// Delete Course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await CourseModel.deleteOne({ id: req.params.id });
    }
  } catch (e) {
    console.error('Mongo course delete error:', e);
  }

  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const filtered = courses.filter((c) => c.id !== req.params.id);
  writeJsonFile(COURSES_FILE, filtered);

  broadcastUpdate('COURSE_DELETED', { id: req.params.id });
  res.json({ success: true, message: `Course ${req.params.id} deleted` });
});

// ==========================================
// 3. STUDENTS & ENROLLMENTS API
// ==========================================

app.get('/api/students', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const students = await StudentModel.find().sort({ createdAt: -1 }).lean();
      if (students && students.length > 0) return res.json(students);
    }
  } catch (e) {
    console.error('Mongo students get error:', e);
  }
  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  res.json(students);
});

app.post('/api/students', async (req, res) => {
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

  let savedStudent;

  try {
    if (mongoose.connection.readyState === 1) {
      const existing = await StudentModel.findOne({
        email: { $regex: new RegExp(`^${newStudent.email}$`, 'i') },
        courseId: newStudent.courseId
      });
      if (existing) {
        savedStudent = await StudentModel.findOneAndUpdate(
          { _id: existing._id },
          { ...newStudent, id: existing.id },
          { new: true }
        ).lean();
      } else {
        savedStudent = await StudentModel.create(newStudent);
      }
    }
  } catch (e) {
    console.error('Mongo student post error:', e);
  }

  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const existingIdx = students.findIndex(
    (s) => s.email.toLowerCase() === newStudent.email.toLowerCase() && s.courseId === newStudent.courseId
  );
  if (existingIdx !== -1) {
    students[existingIdx] = { ...students[existingIdx], ...newStudent, id: students[existingIdx].id };
    writeJsonFile(STUDENTS_FILE, students);
    if (!savedStudent) savedStudent = students[existingIdx];
  } else {
    students.unshift(newStudent);
    writeJsonFile(STUDENTS_FILE, students);
    if (!savedStudent) savedStudent = newStudent;
  }

  broadcastUpdate('STUDENT_ENROLLED', savedStudent);
  console.log(`[BACKEND] Student Enrolled: ${savedStudent.name} (${savedStudent.courseTitle})`);
  res.status(201).json({ success: true, student: savedStudent });
});

app.put('/api/students/:id', async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      updated = await StudentModel.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body, id: req.params.id },
        { new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo student update error:', e);
  }

  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const idx = students.findIndex((s) => s.id === req.params.id);
  if (idx !== -1) {
    students[idx] = { ...students[idx], ...req.body, id: students[idx].id };
    writeJsonFile(STUDENTS_FILE, students);
    if (!updated) updated = students[idx];
  }

  if (!updated) return res.status(404).json({ error: 'Student not found' });
  broadcastUpdate('STUDENT_UPDATED', updated);
  res.json({ success: true, student: updated });
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await StudentModel.deleteOne({ id: req.params.id });
    }
  } catch (e) {
    console.error('Mongo student delete error:', e);
  }

  const students = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
  const filtered = students.filter((s) => s.id !== req.params.id);
  writeJsonFile(STUDENTS_FILE, filtered);

  broadcastUpdate('STUDENT_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// 4. ARTWORKS API
// ==========================================

app.get('/api/artworks', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const artworks = await ArtworkModel.find().lean();
      if (artworks && artworks.length > 0) return res.json(artworks);
    }
  } catch (e) {
    console.error('Mongo artworks get error:', e);
  }
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  res.json(artworks);
});

app.get('/api/artworks/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const item = await ArtworkModel.findOne({ id: req.params.id }).lean();
      if (item) return res.json(item);
    }
  } catch (e) {
    console.error('Mongo artwork get error:', e);
  }
  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const item = artworks.find((a) => a.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Artwork not found' });
  res.json(item);
});

app.post('/api/artworks', async (req, res) => {
  const body = req.body;
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

  try {
    if (mongoose.connection.readyState === 1) {
      await ArtworkModel.findOneAndUpdate({ id: newArtwork.id }, newArtwork, { upsert: true });
    }
  } catch (e) {
    console.error('Mongo artwork create error:', e);
  }

  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  artworks.unshift(newArtwork);
  writeJsonFile(ARTWORKS_FILE, artworks);

  broadcastUpdate('ARTWORK_CREATED', newArtwork);
  console.log(`[BACKEND] New Artwork Added: "${newArtwork.title}" (#${newArtwork.id}) - ₹${newArtwork.price}`);
  res.status(201).json({ success: true, artwork: newArtwork });
});

app.put('/api/artworks/:id', async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      updated = await ArtworkModel.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body, id: req.params.id },
        { new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo artwork update error:', e);
  }

  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const idx = artworks.findIndex((a) => a.id === req.params.id);
  if (idx !== -1) {
    artworks[idx] = { ...artworks[idx], ...req.body, id: artworks[idx].id };
    writeJsonFile(ARTWORKS_FILE, artworks);
    if (!updated) updated = artworks[idx];
  }

  if (!updated) return res.status(404).json({ error: 'Artwork not found' });
  broadcastUpdate('ARTWORK_UPDATED', updated);
  res.json({ success: true, artwork: updated });
});

app.delete('/api/artworks/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await ArtworkModel.deleteOne({ id: req.params.id });
    }
  } catch (e) {
    console.error('Mongo artwork delete error:', e);
  }

  const artworks = readJsonFile(ARTWORKS_FILE, INITIAL_SEED_ARTWORKS);
  const filtered = artworks.filter((a) => a.id !== req.params.id);
  writeJsonFile(ARTWORKS_FILE, filtered);

  broadcastUpdate('ARTWORK_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// 5. ORDERS API
// ==========================================

app.get('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await OrderModel.find().sort({ createdAt: -1, _id: -1 }).lean();
      if (orders && orders.length > 0) return res.json(orders);
    }
  } catch (e) {
    console.error('Mongo orders get error:', e);
  }
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  res.json(orders);
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await OrderModel.findOne({ id: req.params.id }).lean();
      if (order) return res.json(order);
    }
  } catch (e) {
    console.error('Mongo order get error:', e);
  }
  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  const body = req.body;
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

  try {
    if (mongoose.connection.readyState === 1) {
      await OrderModel.findOneAndUpdate({ id: newOrder.id }, newOrder, { upsert: true });
    }
  } catch (e) {
    console.error('Mongo order create error:', e);
  }

  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  orders.unshift(newOrder);
  writeJsonFile(ORDERS_FILE, orders);

  broadcastUpdate('ORDER_CREATED', newOrder);
  console.log(`[BACKEND] New Order Placed: #${newOrder.id} - ${newOrder.customerName} - ₹${newOrder.totalAmount}`);
  res.status(201).json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      updated = await OrderModel.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body, id: req.params.id },
        { new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo order update error:', e);
  }

  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id };
    writeJsonFile(ORDERS_FILE, orders);
    if (!updated) updated = orders[idx];
  }

  if (!updated) return res.status(404).json({ error: 'Order not found' });
  broadcastUpdate('ORDER_UPDATED', updated);
  res.json({ success: true, order: updated });
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await OrderModel.deleteOne({ id: req.params.id });
    }
  } catch (e) {
    console.error('Mongo order delete error:', e);
  }

  const orders = readJsonFile(ORDERS_FILE, INITIAL_SEED_ORDERS);
  const filtered = orders.filter((o) => o.id !== req.params.id);
  writeJsonFile(ORDERS_FILE, filtered);

  broadcastUpdate('ORDER_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

app.delete('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await OrderModel.deleteMany({});
    }
  } catch (e) {
    console.error('Mongo orders clear error:', e);
  }

  writeJsonFile(ORDERS_FILE, []);
  broadcastUpdate('ORDERS_CLEARED', {});
  res.json({ success: true, message: 'All orders cleared' });
});

// ==========================================
// 6. ARTIST PROFILE & ATELIER VIDEO API
// ==========================================

app.get('/api/profile', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let profile = await ProfileModel.findOne({ id: 'primary_profile' }).lean();
      if (!profile) {
        profile = await ProfileModel.create(INITIAL_ARTIST_PROFILE);
      }
      return res.json(profile);
    }
  } catch (e) {
    console.error('Mongo profile get error:', e);
  }
  const profile = readJsonFile(PROFILE_FILE, INITIAL_ARTIST_PROFILE);
  res.json(profile);
});

app.put('/api/profile', async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      updated = await ProfileModel.findOneAndUpdate(
        { id: 'primary_profile' },
        { ...req.body, id: 'primary_profile' },
        { upsert: true, new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo profile update error:', e);
  }

  const current = readJsonFile(PROFILE_FILE, INITIAL_ARTIST_PROFILE);
  const merged = { ...current, ...req.body, id: 'primary_profile' };
  writeJsonFile(PROFILE_FILE, merged);
  if (!updated) updated = merged;

  broadcastUpdate('PROFILE_UPDATED', updated);
  console.log(`[BACKEND] Artist Profile / Atelier Video Updated: "${updated.studioVideoTitle}"`);
  res.json({ success: true, profile: updated });
});

// ==========================================
// 7. RAZORPAY PAYMENT API
// ==========================================

app.post('/api/payment/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  const amountInPaise = Math.round(Number(amount) * 100);

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKeyId && razorpayKeySecret) {
    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {}
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
        isLiveRazorpay: true
      });
    } catch (err) {
      console.error('Razorpay order creation error:', err);
      return res.status(500).json({ error: 'Failed to create Razorpay order', details: err.message });
    }
  } else {
    // Demo Simulator Mode when real keys are not yet provided
    const demoOrderId = `order_demo_${Date.now()}`;
    return res.json({
      success: true,
      orderId: demoOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_placeholder',
      isLiveRazorpay: false,
      message: 'Razorpay keys not yet set in environment. Running in Demo Simulator mode.'
    });
  }
});

app.post('/api/payment/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKeySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
    } else {
      return res.status(400).json({ success: false, verified: false, error: 'Invalid payment signature verification failed' });
    }
  } else {
    // Simulator verification
    return res.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
      mode: 'simulator'
    });
  }
});

// ==========================================
// 8. BUNNY STREAM VIDEO UPLOAD API
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max
});

const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '765702';
const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY || 'baefbf98-2a8c-46d2-a6e5a219a81c-699b-4f46';
const BUNNY_CDN_HOST = process.env.BUNNY_CDN_HOST || 'vz-0cb43856-2c7.b-cdn.net';

// Direct Bunny Stream TUS Upload Auth Endpoint (Handles 2GB+ High Speed Browser Uploads Directly to Bunny.net)
app.post('/api/upload/bunny-token', async (req, res) => {
  try {
    const title = req.body.title || `Kuldeep Studio Video - ${Date.now()}`;

    // 1. Create Video Entry in Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create video entry in Bunny Stream: ${createRes.status} ${errText}`);
    }

    const videoData = await createRes.json();
    const videoId = videoData.guid;

    // 2. Generate TUS Auth Signature (Valid for 24 Hours)
    // Formula: SHA256(library_id + api_key + expiration_time + video_id)
    const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const signature = crypto.createHash('sha256').update(BUNNY_LIBRARY_ID + BUNNY_API_KEY + expiration + videoId).digest('hex');

    // 3. URLs
    const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;
    const directPlayUrl = `https://${BUNNY_CDN_HOST}/${videoId}/play_720p.mp4`;
    const hlsUrl = `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
    const thumbnailUrl = `https://${BUNNY_CDN_HOST}/${videoId}/thumbnail.jpg`;

    console.log(`[BUNNY STREAM TUS] Generated upload token for video "${title}" (GUID: ${videoId})`);

    return res.json({
      success: true,
      libraryId: BUNNY_LIBRARY_ID,
      videoId,
      expiration,
      signature,
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      embedUrl,
      directPlayUrl,
      hlsUrl,
      thumbnailUrl,
      title
    });
  } catch (err) {
    console.error('❌ [BUNNY STREAM TUS] Token generation error:', err);
    return res.status(500).json({ error: 'Failed to generate Bunny upload token', details: err.message });
  }
});

app.post('/api/upload/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const title = req.body.title || req.file.originalname || `Kuldeep Studio Atelier Video - ${Date.now()}`;
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`[BUNNY STREAM] Initiating upload: "${title}" (${fileSizeMB} MB)`);

    // 1. Create Video Object in Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create video entry in Bunny Stream: ${createRes.status} ${errText}`);
    }

    const videoData = await createRes.json();
    const videoGuid = videoData.guid;
    console.log(`[BUNNY STREAM] Video created: GUID ${videoGuid}. Now uploading binary data...`);

    // 2. Upload Binary Stream to Bunny Stream
    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoGuid}`, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: req.file.buffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Failed to upload binary stream to Bunny: ${uploadRes.status} ${errText}`);
    }

    console.log(`✅ [BUNNY STREAM] Video binary uploaded successfully for GUID: ${videoGuid}!`);

    // 3. Generate High-Speed CDN & Player URLs
    const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoGuid}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;
    const directPlayUrl = `https://${BUNNY_CDN_HOST}/${videoGuid}/play_720p.mp4`;
    const hlsUrl = `https://${BUNNY_CDN_HOST}/${videoGuid}/playlist.m3u8`;
    const thumbnailUrl = `https://${BUNNY_CDN_HOST}/${videoGuid}/thumbnail.jpg`;

    // 4. Update MongoDB Profile Automatically ONLY IF requested as profile video
    const isProfile = req.body.isProfileVideo === 'true' || req.body.isProfileVideo === true || req.body.isProfile === 'true';
    if (isProfile) {
      try {
        if (mongoose.connection.readyState === 1) {
          await ProfileModel.findOneAndUpdate(
            { id: 'primary_profile' },
            {
              studioVideoUrl: embedUrl,
              studioVideoTitle: title,
              studioVideoPoster: thumbnailUrl,
              updatedAt: new Date().toISOString()
            },
            { upsert: true }
          );
        }
      } catch (dbErr) {
        console.error('Failed to auto-update profile in mongo:', dbErr);
      }

      // Backup to local file
      const currentProfile = readJsonFile(PROFILE_FILE, INITIAL_ARTIST_PROFILE);
      currentProfile.studioVideoUrl = embedUrl;
      currentProfile.studioVideoTitle = title;
      currentProfile.studioVideoPoster = thumbnailUrl;
      writeJsonFile(PROFILE_FILE, currentProfile);

      // Broadcast live SSE update
      broadcastUpdate('PROFILE_UPDATED', currentProfile);
    }

    return res.json({
      success: true,
      message: 'Video successfully uploaded to Bunny Stream!',
      videoGuid,
      embedUrl,
      directPlayUrl,
      hlsUrl,
      thumbnailUrl,
      title
    });
  } catch (err) {
    console.error('❌ [BUNNY STREAM] Upload Error:', err);
    return res.status(500).json({ error: 'Video upload to Bunny Stream failed', details: err.message });
  }
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🎨 Artist Kuldeep Singh 24/7 Complete Cloud API Online!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`☁️ Database: MongoDB Atlas (Cluster0)`);
  console.log(`💳 Razorpay Gateway: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Demo Simulator Active'}`);
  console.log(`====================================================`);
});
