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
import nodemailer from 'nodemailer';

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
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

const INITIAL_SEED_COURSES = [];

const INITIAL_LIVE_STATUS = {
  isLive: false,
  liveStreamUrl: 'https://meet.google.com/ks-studio-atelier',
  courseId: null,
  courseTitle: null,
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

const INITIAL_SEED_USERS = [
  {
    id: 'usr-student-demo',
    name: 'Aarav Sharma',
    username: 'aarav_sharma',
    email: 'student@kuldeepsingh.art',
    passwordHash: 'eed2fe86b0d10b559378d714458373bde40b474cb768ac2d40ac526272e8ff0e733678fdad3b5857f442bb3e8a67f801575c514ca6442458b96d88cf4678f042',
    passwordSalt: 'e57ce6adb0e56ad4039fd850e99b6027',
    role: 'student',
    isEmailVerified: true,
    enrolledCourseIds: ['course-oil-mastery', 'course-realistic-sketching'],
    currentDeviceId: '',
    currentSessionToken: '',
    isBlocked: false
  },
  {
    id: 'usr-collector-demo',
    name: 'Countess Vivienne',
    username: 'countess_vivienne',
    email: 'collector@kuldeepsingh.art',
    passwordHash: 'e0c0adba5aee5bd8802d081e1ec074709c7f00ab4252cd83c70d15ef56e6427329494c0264353b22cde1d7a445568f70ba03d5d93ea673acb5a89573c5d14228',
    passwordSalt: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    role: 'collector',
    isEmailVerified: true,
    enrolledCourseIds: [],
    currentDeviceId: '',
    currentSessionToken: '',
    isBlocked: false
  }
];

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
  images: [String],
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
  username: String,
  plainPassword: { type: String, default: '' },
  phone: String,
  courseId: String,
  courseTitle: String,
  batchSchedule: String,
  enrolledDate: String,
  feesPaid: Number,
  paymentStatus: String,
  progressPercent: Number,
  avatar: String,
  attendanceStatus: { type: String, default: 'Pending' }
}, { timestamps: true, strict: false });

const LiveStatusSchema = new mongoose.Schema({
  isLive: Boolean,
  liveStreamUrl: String,
  courseId: String,
  courseTitle: String,
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

const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  plainPassword: { type: String, default: '' },
  role: { type: String, enum: ['student', 'collector', 'admin'], default: 'student' },
  isEmailVerified: { type: Boolean, default: false },
  enrolledCourseIds: { type: [String], default: [] },
  currentDeviceId: { type: String, default: '' },
  currentSessionToken: { type: String, default: '' },
  lastLoginAt: { type: Date, default: Date.now },
  lastHeartbeatAt: { type: Date, default: Date.now },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    if (!password || !hash || !salt) return false;
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return checkHash === hash;
  } catch {
    return false;
  }
}

const OrderModel = mongoose.model('Order', OrderSchema);
const ArtworkModel = mongoose.model('Artwork', ArtworkSchema);
const CourseModel = mongoose.model('Course', CourseSchema);
const StudentModel = mongoose.model('Student', StudentSchema);
const LiveStatusModel = mongoose.model('LiveStatus', LiveStatusSchema);
const ProfileModel = mongoose.model('Profile', ProfileSchema);
const ActiveSessionModel = mongoose.model('ActiveSession', ActiveSessionSchema);
const UserModel = mongoose.model('User', UserSchema);

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
      const existingCourses = readJsonFile(COURSES_FILE, []);
      if (Array.isArray(existingCourses) && existingCourses.length > 0) {
        await CourseModel.insertMany(existingCourses);
        console.log(`[BACKEND] Seeded ${existingCourses.length} courses into MongoDB Atlas`);
      }
    }

    // Auto-seed Students if collection is empty
    const studentCount = await StudentModel.countDocuments();
    if (studentCount === 0) {
      const existingStudents = fs.existsSync(STUDENTS_FILE) ? readJsonFile(STUDENTS_FILE, []) : INITIAL_SEED_STUDENTS;
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

    // Auto-seed Users if collection is empty
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      const existingUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
      if (existingUsers.length > 0) {
        await UserModel.insertMany(existingUsers);
        console.log(`[BACKEND] Seeded ${existingUsers.length} users into MongoDB Atlas`);
      }
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
// 1B. USER AUTHENTICATION & SINGLE-DEVICE SESSION API
// ==========================================

// In-Memory Fast Cache for Active Sessions (Device Locking)
// email -> { deviceId, sessionToken, courseId, lastHeartbeat: number }
const activeSessionsCache = new Map();

// Pending Registrations Store (Awaiting 6-digit Email OTP Verification)
// email -> { email, username, name, passwordHash, passwordSalt, role, otp, expiresAt }
const pendingRegistrations = new Map();

// Nodemailer Dynamic Transporter Setup
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && host !== 'smtp.gmail.com') {
    return nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

// Helper to send 6-Digit OTP Email
async function sendOtpEmail(toEmail, otp, name) {
  const subject = `Your Verification Code for Kuldeep Singh Fine Art Atelier: ${otp}`;
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0c0e14; color: #f4ede4; border: 1px solid #d4af37; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #d4af37; font-size: 26px; letter-spacing: 2px; margin: 0;">KULDEEP SINGH</h1>
        <p style="color: #a3998b; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; margin: 5px 0 0;">Fine Art Atelier & Masterclasses</p>
      </div>
      <div style="background-color: #161922; border-radius: 6px; padding: 25px; border: 1px solid #2a2e3d; text-align: center;">
        <p style="font-size: 16px; color: #e2ddd5; margin-bottom: 20px;">Namaste ${name || 'Artist'},</p>
        <p style="font-size: 14px; color: #a3998b; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering at Kuldeep Singh Fine Art Atelier. Please enter the following 6-digit verification code to complete your registration:
        </p>
        <div style="display: inline-block; padding: 15px 35px; background: #000; border: 2px solid #d4af37; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4af37; margin-bottom: 25px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #736d65; margin: 0;">
          This code is valid for 10 minutes. If you did not request this registration, please ignore this email.
        </p>
      </div>
      <div style="text-align: center; margin-top: 25px; color: #5a564f; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Artist Kuldeep Singh Atelier. All rights reserved.
      </div>
    </div>
  `;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = getMailTransporter();
      await transporter.sendMail({
        from: `"Kuldeep Singh Atelier" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html
      });
      console.log(`[AUTH-OTP] Sent OTP ${otp} via email to ${toEmail}`);
      return { sentViaSmtp: true };
    } catch (err) {
      console.error(`[AUTH-OTP] Failed to send via SMTP to ${toEmail}:`, err.message);
      console.log(`[AUTH-OTP FALLBACK] Verification code for ${toEmail}: ${otp}`);
      return { sentViaSmtp: false, error: err.message, otp };
    }
  } else {
    console.log(`====================================================`);
    console.log(`[AUTH-OTP DEMO] Verification code for ${toEmail}: ${otp}`);
    console.log(`====================================================`);
    return { sentViaSmtp: false, demo: true, otp };
  }
}

// Helper to find a user by email (MongoDB Atlas with fallback to users.json)
async function findUserByEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await UserModel.findOne({ email: cleanEmail }).lean();
      if (user) return user;
    } catch (err) {
      console.warn('Mongo find user error:', err.message);
    }
  }
  const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
  return localUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail) || null;
}

// Helper to find a user by Email OR Unique Username
async function findUserByEmailOrUsername(identifier) {
  const clean = (identifier || '').trim().toLowerCase();
  if (!clean) return null;
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await UserModel.findOne({
        $or: [
          { email: clean },
          { username: clean }
        ]
      }).lean();
      if (user) return user;
    } catch (err) {
      console.warn('Mongo find user error:', err.message);
    }
  }
  const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
  return localUsers.find(u => (u.email && u.email.toLowerCase() === clean) || (u.username && u.username.toLowerCase() === clean)) || null;
}

// Helper to check if a username is already taken
async function isUsernameTaken(username) {
  const clean = (username || '').trim().toLowerCase();
  if (!clean) return false;
  if (mongoose.connection.readyState === 1) {
    try {
      const exists = await UserModel.findOne({ username: clean }).lean();
      if (exists) return true;
    } catch (err) {}
  }
  const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
  return localUsers.some(u => u.username && u.username.toLowerCase() === clean);
}

// 0. CHECK USERNAME AVAILABILITY
app.post('/api/auth/check-username', async (req, res) => {
  const { username } = req.body;
  const clean = (username || '').trim().toLowerCase();
  if (!clean || clean.length < 3) {
    return res.status(400).json({ available: false, error: 'Username must be at least 3 characters long.' });
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    return res.status(400).json({ available: false, error: 'Username can only contain lowercase letters, numbers, and underscores (_).' });
  }
  const taken = await isUsernameTaken(clean);
  return res.json({ available: !taken, username: clean, message: taken ? 'Username already taken' : 'Username is available' });
});

// 1A. SEND REGISTRATION OTP (Initiates Registration Flow)
app.post('/api/auth/send-registration-otp', async (req, res) => {
  try {
    const { email, username, password, name, role = 'student' } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanName = (name || '').trim() || (role === 'collector' ? 'Art Collector' : 'Academy Scholar');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Kripya ek valid email address enter karein.' });
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({ success: false, error: 'Ek unique username chunein (kam se kam 3 characters).' });
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username me sirf letters, numbers aur underscore (_) allow hain.' });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password kam se kam 6 characters ka hona chahiye.' });
    }

    // STRICT CHECK 1: Email must be strictly unique (1 Email = 1 Account)
    const existingUserByEmail = await findUserByEmail(cleanEmail);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: 'Yeh email address pehle se registered hai! Ek email par ek hi account ban sakta hai. Kripya "Sign In" option chunein.'
      });
    }

    // STRICT CHECK 2: Username must be unique
    const usernameTaken = await isUsernameTaken(cleanUsername);
    if (usernameTaken) {
      return res.status(400).json({
        success: false,
        error: `Username "@${cleanUsername}" pehle se kisi aur ne le rakha hai. Kripya doosra unique username chunein.`
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const { hash, salt } = hashPassword(cleanPassword);

    pendingRegistrations.set(cleanEmail, {
      email: cleanEmail,
      username: cleanUsername,
      name: cleanName,
      passwordHash: hash,
      passwordSalt: salt,
      plainPassword: cleanPassword,
      role: role === 'collector' ? 'collector' : 'student',
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    const mailResult = await sendOtpEmail(cleanEmail, otp, cleanName);

    return res.json({
      success: true,
      message: `6-digit verification code has been sent to ${cleanEmail}`,
      email: cleanEmail,
      username: cleanUsername,
      demoOtp: mailResult.demo || !mailResult.sentViaSmtp ? otp : undefined
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, error: 'OTP bhejne me dikkat aayi. Kripya punah prayas karein.' });
  }
});

// 1B. VERIFY REGISTRATION OTP & FINALIZE ACCOUNT
app.post('/api/auth/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, error: 'Email aur 6-digit OTP dono anivarya hain.' });
    }

    const pending = pendingRegistrations.get(cleanEmail);
    if (!pending) {
      return res.status(400).json({
        success: false,
        error: 'Koi pending registration nahi mila ya OTP expire ho gaya hai. Kripya punah register karein.'
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'OTP expire ho gaya hai (10 minutes limit). Kripya naya OTP generate karein.'
      });
    }

    // Check OTP match (allow master test OTP 777999 for local testing convenience)
    if (pending.otp !== cleanOtp && cleanOtp !== '777999') {
      return res.status(400).json({
        success: false,
        error: 'Galat OTP code! Kripya apni email par bheja gaya 6-digit code enter karein.'
      });
    }

    // Double check email uniqueness
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      pendingRegistrations.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'Yeh email pehle se registered hai! Kripya Sign In karein.'
      });
    }

    // Generate session token and deviceId
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const newDeviceId = deviceId || `dev_${Date.now()}`;

    // Cross-check if already pre-enrolled by admin
    const allStudents = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
    const preEnrolled = allStudents.filter(s => s.email.toLowerCase() === cleanEmail);
    const enrolledIds = preEnrolled.map(s => s.courseId);

    const newUser = {
      id: `usr_${Date.now()}`,
      name: pending.name,
      email: cleanEmail,
      username: pending.username,
      passwordHash: pending.passwordHash,
      passwordSalt: pending.passwordSalt,
      plainPassword: pending.plainPassword || '',
      role: pending.role,
      isEmailVerified: true,
      enrolledCourseIds: enrolledIds,
      currentDeviceId: newDeviceId,
      currentSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastHeartbeatAt: new Date(),
      isBlocked: false
    };

    if (mongoose.connection.readyState === 1) {
      await UserModel.create(newUser);
    }

    const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    localUsers.unshift(newUser);
    writeJsonFile(USERS_FILE, localUsers);

    // Remove from pending store
    pendingRegistrations.delete(cleanEmail);

    // Set active single-device session
    activeSessionsCache.set(cleanEmail, {
      deviceId: newDeviceId,
      sessionToken,
      courseId: enrolledIds[0] || '',
      lastHeartbeat: Date.now()
    });

    console.log(`✅ [AUTH] Account Verified & Created: ${cleanEmail} (@${pending.username})`);

    res.status(201).json({
      success: true,
      message: 'Account verified successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isEmailVerified: true,
        enrolledCourseIds: newUser.enrolledCourseIds,
        sessionToken: sessionToken,
        deviceId: newDeviceId
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'OTP verification failed. Kripya punah prayas karein.' });
  }
});

// 1C. DIRECT REGISTER USER (Supports both direct and fallback)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, name, role = 'student', deviceId } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const cleanPassword = (password || '').trim();
    const cleanName = (name || '').trim() || (role === 'collector' ? 'Art Collector' : 'Academy Scholar');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Kripya ek valid email address enter karein.' });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password kam se kam 6 characters ka hona chahiye.' });
    }

    // STRICT CHECK: Verify if email is already registered
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Yeh email address pehle se registered hai! Kripya "Sign In" option chunein aur apna password dalein.'
      });
    }

    // Check username
    const usernameTaken = await isUsernameTaken(cleanUsername);
    let finalUsername = cleanUsername;
    if (usernameTaken) {
      finalUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    // Hash password with salt
    const { hash, salt } = hashPassword(cleanPassword);
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const newDeviceId = deviceId || `dev_${Date.now()}`;

    // Cross-check if admin has already enrolled this email in any course in students list
    const allStudents = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
    const preEnrolled = allStudents.filter(s => s.email.toLowerCase() === cleanEmail);
    const enrolledIds = preEnrolled.map(s => s.courseId);

    const newUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      username: finalUsername,
      passwordHash: hash,
      passwordSalt: salt,
      plainPassword: cleanPassword,
      role: role === 'collector' ? 'collector' : 'student',
      isEmailVerified: true,
      enrolledCourseIds: enrolledIds,
      currentDeviceId: newDeviceId,
      currentSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastHeartbeatAt: new Date(),
      isBlocked: false
    };

    if (mongoose.connection.readyState === 1) {
      await UserModel.create(newUser);
    }

    const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    localUsers.unshift(newUser);
    writeJsonFile(USERS_FILE, localUsers);

    // Set active session in memory
    activeSessionsCache.set(cleanEmail, {
      deviceId: newDeviceId,
      sessionToken,
      courseId: enrolledIds[0] || '',
      lastHeartbeat: Date.now()
    });

    console.log(`[AUTH] New User Registered: ${cleanEmail} (@${finalUsername}) (${newUser.role})`);
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isEmailVerified: true,
        enrolledCourseIds: newUser.enrolledCourseIds,
        sessionToken: sessionToken,
        deviceId: newDeviceId
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Kripya punah prayas karein.' });
  }
});

// 2. LOGIN USER (Allows Email OR Unique Username + Strict Password Verification + Single Device Locking)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, loginIdentifier, password, deviceId } = req.body;
    const identifier = (loginIdentifier || email || username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!identifier || !cleanPassword) {
      return res.status(400).json({ success: false, error: 'Email/Username aur password dono anivarya hain.' });
    }

    // Lookup user by either Email OR Username
    const user = await findUserByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: `"${identifier}" se koi account registered nahi mila. Kripya pehle "Register" karein.`
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Aapka account admin dwara suspend kiya gaya hai. Kripya studio management se sampark karein.'
      });
    }

    // Verify Password
    const isMatch = verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Galat password! Kripya sahi password enter karein.'
      });
    }

    // Generate BRAND NEW active session token (Invalidates ANY other logged in device / phone / laptop)
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const newDeviceId = deviceId || `dev_${Date.now()}`;
    const userEmail = user.email.toLowerCase();

    // Reconcile any newly added courses from students list
    const allStudents = readJsonFile(STUDENTS_FILE, INITIAL_SEED_STUDENTS);
    const studentRecords = allStudents.filter(s => s.email.toLowerCase() === userEmail);
    const existingIds = new Set(user.enrolledCourseIds || []);
    studentRecords.forEach(s => existingIds.add(s.courseId));
    const mergedCourseIds = Array.from(existingIds);

    // Save session in MongoDB
    if (mongoose.connection.readyState === 1) {
      await UserModel.updateOne(
        { email: userEmail },
        {
          currentSessionToken: sessionToken,
          currentDeviceId: newDeviceId,
          lastLoginAt: new Date(),
          lastHeartbeatAt: new Date(),
          enrolledCourseIds: mergedCourseIds
        }
      );
    }

    // Save session in local file
    const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    const idx = localUsers.findIndex(u => u.email.toLowerCase() === userEmail);
    if (idx !== -1) {
      localUsers[idx].currentSessionToken = sessionToken;
      localUsers[idx].currentDeviceId = newDeviceId;
      localUsers[idx].lastLoginAt = new Date();
      localUsers[idx].enrolledCourseIds = mergedCourseIds;
      writeJsonFile(USERS_FILE, localUsers);
    }

    // Update in-memory active session cache (Overrides any previous device immediately)
    activeSessionsCache.set(userEmail, {
      deviceId: newDeviceId,
      sessionToken,
      courseId: mergedCourseIds[0] || '',
      lastHeartbeat: Date.now()
    });

    if (mongoose.connection.readyState === 1) {
      ActiveSessionModel.findOneAndUpdate(
        { email: userEmail },
        { email: userEmail, deviceId: newDeviceId, lastHeartbeat: new Date() },
        { upsert: true }
      ).catch(() => {});
    }

    console.log(`[AUTH] User Logged In: ${userEmail} (@${user.username || 'patron'}) on device ${newDeviceId}`);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        role: user.role,
        isEmailVerified: Boolean(user.isEmailVerified),
        enrolledCourseIds: mergedCourseIds,
        sessionToken: sessionToken,
        deviceId: newDeviceId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Kripya punah prayas karein.' });
  }
});

// 3. VALIDATE ACTIVE SESSION (Called periodically or before playing media)
app.post('/api/auth/validate-session', async (req, res) => {
  const { email, sessionToken, deviceId } = req.body;
  if (!email || !sessionToken) {
    return res.status(400).json({ valid: false, error: 'email and sessionToken are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cached = activeSessionsCache.get(cleanEmail);

  if (cached && cached.sessionToken && cached.sessionToken !== sessionToken) {
    return res.json({
      valid: false,
      kickedOut: true,
      reason: 'SESSION_SUPERSEDED',
      message: 'Security Alert: Aapka account kisi doosre device (phone/laptop) par login kar liya gaya hai. Ek samay par sirf 1 device allowed hai.'
    });
  }

  const user = await findUserByEmail(cleanEmail);
  if (!user || (user.currentSessionToken && user.currentSessionToken !== sessionToken)) {
    return res.json({
      valid: false,
      kickedOut: true,
      reason: 'SESSION_EXPIRED_OR_SUPERSEDED',
      message: 'Security Alert: Aapka session doosre device par switch ho gaya hai. Suraksha ke liye is device ko logout kar diya gaya hai.'
    });
  }

  res.json({ valid: true });
});

// 4. SESSION HEARTBEAT (Enforces Single Active Device in Real-Time)
app.post('/api/session/heartbeat', async (req, res) => {
  const { email, deviceId, sessionToken, courseId, forceTakeover } = req.body;
  if (!email || !deviceId) {
    return res.status(400).json({ error: 'email and deviceId are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const SESSION_TIMEOUT_MS = 12000; // 12 seconds inactivity timeout

  // Check in-memory cache first
  let cached = activeSessionsCache.get(cleanEmail);

  // If not in cache, check Mongo
  if (!cached && mongoose.connection.readyState === 1) {
    try {
      const doc = await ActiveSessionModel.findOne({ email: cleanEmail }).lean();
      if (doc) {
        cached = {
          deviceId: doc.deviceId,
          sessionToken: '',
          courseId: doc.courseId,
          lastHeartbeat: new Date(doc.lastHeartbeat).getTime()
        };
        activeSessionsCache.set(cleanEmail, cached);
      }
    } catch (err) {
      console.warn('Active session mongo check error:', err.message);
    }
  }

  // If user has a sessionToken, check against active sessionToken
  if (sessionToken && cached && cached.sessionToken && cached.sessionToken !== sessionToken) {
    return res.json({
      allowed: false,
      kickedOut: true,
      reason: 'SESSION_SUPERSEDED',
      message: 'Security Alert: Aapka account kisi doosre device (phone/laptop) par log in ho gaya hai. Ek samay par sirf 1 device par streaming allowed hai.'
    });
  }

  // Case A: No previous active session exists -> Grant access!
  if (!cached) {
    const newSession = { deviceId, sessionToken: sessionToken || '', courseId: courseId || '', lastHeartbeat: now };
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
    if (sessionToken) cached.sessionToken = sessionToken;
    if (courseId) cached.courseId = courseId;
    activeSessionsCache.set(cleanEmail, cached);

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
    if (sessionToken) cached.sessionToken = sessionToken;
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

  // Older device is actively watching!
  const secondsAgo = Math.max(1, Math.round(timeSinceLastHeartbeat / 1000));
  return res.json({
    allowed: false,
    kickedOut: false,
    activeDeviceId: cached.deviceId,
    secondsSinceLastActive: secondsAgo,
    message: 'Active Session Detected: Aapka account kisi doosre device (phone/laptop) par live dekh raha hai. Ek samay par sirf 1 device par class dekhna allowed hai.'
  });
});

// Force Session Takeover endpoint
app.post('/api/session/takeover', async (req, res) => {
  const { email, deviceId, sessionToken, courseId } = req.body;
  if (!email || !deviceId) {
    return res.status(400).json({ error: 'email and deviceId are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();

  activeSessionsCache.set(cleanEmail, {
    deviceId,
    sessionToken: sessionToken || '',
    courseId: courseId || '',
    lastHeartbeat: now
  });

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
// 1D. USER MANAGEMENT API (ALL REGISTERED ACCOUNTS)
// ==========================================

// Get All Registered Users
app.get('/api/users', async (req, res) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      users = await UserModel.find().sort({ createdAt: -1 }).lean();
    }
    if (!users || users.length === 0) {
      users = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    }

    const defaultPasswords = {
      'student@kuldeepsingh.art': 'student123',
      'collector@kuldeepsingh.art': 'collector123',
      'testpatron99@gmail.com': 'patron123',
      'sahildevcode@gmail.com': 'sahil123'
    };

    const sanitized = (users || []).map((u) => {
      const email = (u.email || '').toLowerCase();
      return {
        id: u.id || String(u._id),
        _id: u._id,
        name: u.name || 'Academy Scholar',
        email: u.email,
        username: u.username || (u.email ? u.email.split('@')[0] : 'student'),
        plainPassword: u.plainPassword || defaultPasswords[email] || 'art123456',
        role: u.role || 'student',
        isEmailVerified: Boolean(u.isEmailVerified),
        enrolledCourseIds: u.enrolledCourseIds || [],
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt || new Date().toISOString(),
        isBlocked: Boolean(u.isBlocked)
      };
    });

    res.json(sanitized);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Registered User (Name, Email, Username, Password, Role)
app.put('/api/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const { name, email, username, password, plainPassword, role, enrolledCourseIds, isBlocked } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (username) updateData.username = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (role) updateData.role = role;
    if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;
    if (Array.isArray(enrolledCourseIds)) updateData.enrolledCourseIds = enrolledCourseIds;

    const newPass = (password || plainPassword || '').trim();
    if (newPass) {
      const { hash, salt } = hashPassword(newPass);
      updateData.passwordHash = hash;
      updateData.passwordSalt = salt;
      updateData.plainPassword = newPass;
    }

    let updatedUser = null;
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      updatedUser = await UserModel.findOneAndUpdate(
        { $or: conditions },
        { $set: updateData },
        { new: true }
      ).lean();

      // If email, name or password changed, also synchronize with StudentModel if this user is enrolled
      const targetEmail = (updatedUser ? updatedUser.email : email);
      if (targetEmail) {
        const studentUpdate = {};
        if (updateData.name) studentUpdate.name = updateData.name;
        if (newPass) studentUpdate.plainPassword = newPass;
        if (updateData.username) studentUpdate.username = updateData.username;
        if (Object.keys(studentUpdate).length > 0) {
          await StudentModel.updateMany(
            { email: { $regex: new RegExp(`^${targetEmail}$`, 'i') } },
            { $set: studentUpdate }
          );
        }
      }
    }

    const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    const idx = localUsers.findIndex((u) => u.id === targetId || String(u._id) === targetId);
    if (idx !== -1) {
      localUsers[idx] = { ...localUsers[idx], ...updateData };
      writeJsonFile(USERS_FILE, localUsers);
      if (!updatedUser) updatedUser = localUsers[idx];
    }

    if (newPass && updatedUser) {
      const localStudents = readJsonFile(STUDENTS_FILE, []);
      let stuUpdated = false;
      localStudents.forEach((s) => {
        if (s.email && updatedUser.email && s.email.toLowerCase() === updatedUser.email.toLowerCase()) {
          s.plainPassword = newPass;
          if (updateData.name) s.name = updateData.name;
          if (updateData.username) s.username = updateData.username;
          stuUpdated = true;
        }
      });
      if (stuUpdated) writeJsonFile(STUDENTS_FILE, localStudents);
    }

    if (!updatedUser) return res.status(404).json({ success: false, error: 'User not found' });

    broadcastUpdate('USER_UPDATED', updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Registered User
app.delete('/api/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      await UserModel.deleteMany({ $or: conditions });
    }
    const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
    const filtered = localUsers.filter((u) => u.id !== targetId && String(u._id) !== targetId);
    writeJsonFile(USERS_FILE, filtered);

    broadcastUpdate('USER_DELETED', { id: targetId });
    res.json({ success: true, id: targetId });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. COURSES & LECTURES API
// ==========================================

const DUMMY_COURSE_IDS = ['course-oil-mastery', 'course-realistic-sketching', 'course-watercolor-fluid', 'course-color-alchemy'];

app.get('/api/courses', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise().catch(() => {});
    }
    if (mongoose.connection.readyState === 1) {
      await CourseModel.deleteMany({ id: { $in: DUMMY_COURSE_IDS } }).catch(() => {});
      const courses = await CourseModel.find({ id: { $nin: DUMMY_COURSE_IDS } }).lean();
      if (Array.isArray(courses)) return res.json(courses);
    }
  } catch (e) {
    console.error('Mongo courses get error:', e);
  }
  const courses = readJsonFile(COURSES_FILE, []);
  res.json(courses.filter((c) => !DUMMY_COURSE_IDS.includes(c.id)));
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
      const existing = await CourseModel.findOne({ id: req.params.id }).lean();
      let updatePayload = { ...req.body, id: req.params.id };

      // PROTECTION: If existing course has modules with lectures, NEVER wipe them out on general updates!
      if (existing && Array.isArray(existing.modules) && existing.modules.some((m) => Array.isArray(m.lectures) && m.lectures.length > 0)) {
        if (Array.isArray(updatePayload.modules) && updatePayload.modules.length > 0) {
          updatePayload.modules = updatePayload.modules.map((m, mIdx) => {
            const existingM = existing.modules[mIdx];
            const incomingLecs = Array.isArray(m.lectures) ? m.lectures : [];
            const existingLecs = (existingM && Array.isArray(existingM.lectures)) ? existingM.lectures : [];

            const mergedLecs = [...incomingLecs];
            for (const exLec of existingLecs) {
              if (!mergedLecs.some((l) => l.id === exLec.id || (l.videoUrl && l.videoUrl === exLec.videoUrl))) {
                mergedLecs.push(exLec);
              }
            }
            return {
              ...m,
              lectures: mergedLecs,
              lessonsCount: mergedLecs.length,
              topics: mergedLecs.map((l) => l.title)
            };
          });
          updatePayload.totalLessons = updatePayload.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount || 0), 0);
        } else {
          // If updatePayload did not include modules or modules was empty, retain existing modules and totalLessons!
          updatePayload.modules = existing.modules;
          updatePayload.totalLessons = existing.totalLessons || existing.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount || 0), 0);
        }
      }

      updatedCourse = await CourseModel.findOneAndUpdate(
        { id: req.params.id },
        updatePayload,
        { new: true, upsert: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo course update error:', e);
  }

  const courses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
  const idx = courses.findIndex((c) => c.id === req.params.id);
  if (idx !== -1) {
    const existingC = courses[idx];
    let payload = { ...courses[idx], ...req.body, id: courses[idx].id };
    if (existingC && Array.isArray(existingC.modules) && existingC.modules.some((m) => Array.isArray(m.lectures) && m.lectures.length > 0)) {
      if (Array.isArray(payload.modules) && payload.modules.length > 0) {
        payload.modules = payload.modules.map((m, mIdx) => {
          const exM = existingC.modules[mIdx];
          const incLecs = Array.isArray(m.lectures) ? m.lectures : [];
          const exLecs = (exM && Array.isArray(exM.lectures)) ? exM.lectures : [];
          const merged = [...incLecs];
          for (const ex of exLecs) {
            if (!merged.some((l) => l.id === ex.id || (l.videoUrl && l.videoUrl === ex.videoUrl))) {
              merged.push(ex);
            }
          }
          return { ...m, lectures: merged, lessonsCount: merged.length, topics: merged.map((l) => l.title) };
        });
        payload.totalLessons = payload.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount || 0), 0);
      } else {
        payload.modules = existingC.modules;
        payload.totalLessons = existingC.totalLessons;
      }
    }
    courses[idx] = payload;
    writeJsonFile(COURSES_FILE, courses);
    if (!updatedCourse) updatedCourse = courses[idx];
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

  broadcastUpdate('COURSE_UPDATED', updatedCourse);
  res.json({ success: true, course: updatedCourse });
});

// Delete Course
app.delete('/api/courses/:id', async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      await CourseModel.deleteMany({ $or: conditions });
    }
  } catch (e) {
    console.error('Mongo course delete error:', e);
  }

  const courses = readJsonFile(COURSES_FILE, []);
  const filtered = courses.filter((c) => c.id !== targetId && c._id !== targetId);
  writeJsonFile(COURSES_FILE, filtered);

  broadcastUpdate('COURSE_DELETED', { id: targetId });
  res.json({ success: true, message: `Course ${targetId} deleted` });
});

// ==========================================
// 3. STUDENTS & ENROLLMENTS API
// ==========================================

app.get('/api/students', async (req, res) => {
  try {
    let students = [];
    let users = [];

    if (mongoose.connection.readyState === 1) {
      students = await StudentModel.find().sort({ createdAt: -1 }).lean();
      users = await UserModel.find().lean();
    } else {
      students = readJsonFile(STUDENTS_FILE, []);
      users = readJsonFile(USERS_FILE, []);
    }

    const defaultPasswords = {
      'student@kuldeepsingh.art': 'student123',
      'aarav.sharma@gmail.com': 'student123',
      'testpatron99@gmail.com': 'patron123',
      'sahildevcode@gmail.com': 'sahil123'
    };

    const enriched = (students || []).map((s) => {
      const email = (s.email || '').toLowerCase();
      const matchedUser = (users || []).find((u) => (u.email || '').toLowerCase() === email);
      const studentPassword = s.plainPassword || (matchedUser ? matchedUser.plainPassword : '') || defaultPasswords[email] || 'art123456';
      const studentUsername = s.username || (matchedUser ? matchedUser.username : '') || (s.email ? s.email.split('@')[0] : 'scholar');

      return {
        ...s,
        id: s.id || String(s._id),
        username: studentUsername,
        plainPassword: studentPassword,
        attendanceStatus: s.attendanceStatus || 'Pending'
      };
    });

    return res.json(enriched);
  } catch (e) {
    console.error('Mongo students get error:', e);
    const students = readJsonFile(STUDENTS_FILE, []);
    res.json(students);
  }
});

app.post('/api/students', async (req, res) => {
  const newStudent = {
    id: req.body.id || `stu-${Date.now()}`,
    name: req.body.name || 'Student Artist',
    email: req.body.email || 'student@kuldeepsingh.art',
    username: req.body.username || (req.body.email ? req.body.email.split('@')[0] : 'scholar'),
    plainPassword: req.body.plainPassword || 'art123456',
    phone: req.body.phone || '',
    courseId: req.body.courseId || 'course-oil-mastery',
    courseTitle: req.body.courseTitle || 'The Master Oil Painting Diploma',
    batchSchedule: req.body.batchSchedule || 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: req.body.enrolledDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    feesPaid: Number(req.body.feesPaid) || 349,
    paymentStatus: req.body.paymentStatus || 'Paid',
    progressPercent: Number(req.body.progressPercent) || 0,
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    attendanceStatus: req.body.attendanceStatus || 'Pending'
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

  const students = readJsonFile(STUDENTS_FILE, []);
  const existingIdx = students.findIndex(
    (s) => s.email && s.email.toLowerCase() === newStudent.email.toLowerCase() && s.courseId === newStudent.courseId
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
  const targetId = req.params.id;
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      updated = await StudentModel.findOneAndUpdate(
        { $or: conditions },
        { ...req.body },
        { new: true }
      ).lean();

      // If password, name, or username updated, sync with UserModel
      const studentEmail = req.body.email || (updated && updated.email);
      if (studentEmail && (req.body.plainPassword || req.body.password || req.body.name || req.body.username)) {
        const userUpdate = {};
        if (req.body.name) userUpdate.name = req.body.name;
        if (req.body.username) userUpdate.username = req.body.username;
        const passToSync = (req.body.plainPassword || req.body.password || '').trim();
        if (passToSync) {
          const { hash, salt } = hashPassword(passToSync);
          userUpdate.passwordHash = hash;
          userUpdate.passwordSalt = salt;
          userUpdate.plainPassword = passToSync;
        }
        await UserModel.updateOne(
          { email: { $regex: new RegExp(`^${studentEmail}$`, 'i') } },
          { $set: userUpdate }
        );
      }
    }
  } catch (e) {
    console.error('Mongo student update error:', e);
  }

  const students = readJsonFile(STUDENTS_FILE, []);
  const idx = students.findIndex((s) => s.id === targetId || String(s._id) === targetId);
  if (idx !== -1) {
    students[idx] = { ...students[idx], ...req.body };
    writeJsonFile(STUDENTS_FILE, students);
    if (!updated) updated = students[idx];
  }

  // Also sync in local users.json if password changed
  const newPass = (req.body.plainPassword || req.body.password || '').trim();
  if (newPass && updated && updated.email) {
    const localUsers = readJsonFile(USERS_FILE, []);
    const uIdx = localUsers.findIndex((u) => (u.email || '').toLowerCase() === (updated.email || '').toLowerCase());
    if (uIdx !== -1) {
      localUsers[uIdx].plainPassword = newPass;
      const { hash, salt } = hashPassword(newPass);
      localUsers[uIdx].passwordHash = hash;
      localUsers[uIdx].passwordSalt = salt;
      if (req.body.name) localUsers[uIdx].name = req.body.name;
      if (req.body.username) localUsers[uIdx].username = req.body.username;
      writeJsonFile(USERS_FILE, localUsers);
    }
  }

  if (!updated) return res.status(404).json({ error: 'Student not found' });
  broadcastUpdate('STUDENT_UPDATED', updated);
  res.json({ success: true, student: updated });
});

app.delete('/api/students/:id', async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      await StudentModel.deleteMany({ $or: conditions });
    }
  } catch (e) {
    console.error('Mongo student delete error:', e);
  }

  const students = readJsonFile(STUDENTS_FILE, []);
  const filtered = students.filter((s) => s.id !== targetId && String(s._id) !== targetId);
  writeJsonFile(STUDENTS_FILE, filtered);

  broadcastUpdate('STUDENT_DELETED', { id: targetId });
  console.log(`[BACKEND] Student Permanently Deleted: ${targetId}`);
  res.json({ success: true, id: targetId });
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

  // Auto-Enrollment into Purchased Courses for Student / Customer
  try {
    const customerEmail = (newOrder.customerEmail || '').trim().toLowerCase();
    const purchasedCourseItems = (newOrder.items || []).filter(item => item.type === 'course' || (item.id && item.id.startsWith('course-')));
    if (customerEmail && purchasedCourseItems.length > 0) {
      const courseIdsToEnroll = purchasedCourseItems.map(item => item.id);

      // Update in MongoDB UserModel
      if (mongoose.connection.readyState === 1) {
        await UserModel.updateOne(
          { email: customerEmail },
          { $addToSet: { enrolledCourseIds: { $each: courseIdsToEnroll } } }
        );
      }

      // Update in local users.json
      const localUsers = readJsonFile(USERS_FILE, INITIAL_SEED_USERS);
      const userIdx = localUsers.findIndex(u => u.email.toLowerCase() === customerEmail);
      if (userIdx !== -1) {
        const existingCourses = new Set(localUsers[userIdx].enrolledCourseIds || []);
        courseIdsToEnroll.forEach(cId => existingCourses.add(cId));
        localUsers[userIdx].enrolledCourseIds = Array.from(existingCourses);
        writeJsonFile(USERS_FILE, localUsers);
      }

      // Add to StudentModel & students.json for each purchased course
      const allCourses = readJsonFile(COURSES_FILE, INITIAL_SEED_COURSES);
      const localStudents = readJsonFile(STUDENTS_FILE, []);

      let userPlainPass = '';
      let userUname = '';
      try {
        if (mongoose.connection.readyState === 1) {
          const matchedUser = await UserModel.findOne({ email: customerEmail }).lean();
          if (matchedUser) {
            userPlainPass = matchedUser.plainPassword || '';
            userUname = matchedUser.username || '';
          }
        } else {
          const localUsers = readJsonFile(USERS_FILE, []);
          const matchedUser = localUsers.find(u => (u.email || '').toLowerCase() === customerEmail.toLowerCase());
          if (matchedUser) {
            userPlainPass = matchedUser.plainPassword || '';
            userUname = matchedUser.username || '';
          }
        }
      } catch (e) {
        // ignore
      }

      for (const item of purchasedCourseItems) {
        const courseDetail = allCourses.find(c => c.id === item.id) || { title: item.title || 'Fine Art Masterclass', schedule: 'Saturday & Sunday • 6:00 PM IST' };
        const studentRecord = {
          id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: newOrder.customerName || 'Academy Scholar',
          email: customerEmail,
          username: userUname || customerEmail.split('@')[0],
          plainPassword: userPlainPass || 'art123456',
          phone: newOrder.customerPhone || '',
          courseId: item.id,
          courseTitle: item.title || courseDetail.title,
          batchSchedule: courseDetail.schedule || 'Saturday & Sunday • 6:00 PM IST',
          enrolledDate: dateStr,
          feesPaid: Number(item.price) || Number(newOrder.totalAmount) || 349,
          paymentStatus: 'Paid',
          progressPercent: 0,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
          attendanceStatus: 'Pending'
        };

        if (mongoose.connection.readyState === 1) {
          await StudentModel.findOneAndUpdate(
            { email: customerEmail, courseId: item.id },
            studentRecord,
            { upsert: true }
          );
        }

        const existingStuIdx = localStudents.findIndex(s => s.email.toLowerCase() === customerEmail && s.courseId === item.id);
        if (existingStuIdx !== -1) {
          localStudents[existingStuIdx] = { ...localStudents[existingStuIdx], ...studentRecord };
        } else {
          localStudents.unshift(studentRecord);
        }
        broadcastUpdate('STUDENT_ENROLLED', studentRecord);
      }
      writeJsonFile(STUDENTS_FILE, localStudents);
      console.log(`[AUTO-ENROLL] Automatically enrolled ${customerEmail} into:`, courseIdsToEnroll);
    }
  } catch (enrollErr) {
    console.error('Auto-enrollment error on order placement:', enrollErr);
  }

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

// Helper function to create Razorpay orders
const createRazorpayOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(401).json({ error: 'Razorpay API credentials not configured in environment' });
  }

  // Validate amount >= 100 paise (1 INR)
  const amountInPaise = Math.round(Number(amount));
  if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
    return res.status(400).json({ error: 'Amount is required and must be at least 100 paise' });
  }

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
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    if (err.statusCode === 401 || (err.error && err.error.code === 'BAD_REQUEST_ERROR' && String(err.error.description).toLowerCase().includes('auth'))) {
      return res.status(401).json({ error: 'Razorpay authentication failed', details: err.message });
    }
    return res.status(500).json({ error: 'Failed to create Razorpay order', details: err.message || err });
  }
};

// Helper function to verify Razorpay payment signature
const verifyRazorpaySignature = (req, res) => {
  const razorpay_order_id = req.body.razorpay_order_id || req.body.order_id;
  const razorpay_payment_id = req.body.razorpay_payment_id || req.body.payment_id;
  const razorpay_signature = req.body.razorpay_signature || req.body.signature;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeySecret) {
    return res.status(401).json({ error: 'Razorpay Secret Key not configured in environment' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing required payment verification fields (order_id, payment_id, signature)'
    });
  }

  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature verification failed'
      });
    }
  } catch (err) {
    console.error('Signature verification error:', err);
    return res.status(500).json({ success: false, error: 'Internal error verifying payment signature', details: err.message });
  }
};

// Register endpoints for both standard and payment-prefixed paths
app.post('/api/create-order', createRazorpayOrder);
app.post('/api/payment/create-order', createRazorpayOrder);
app.post('/api/verify-payment', verifyRazorpaySignature);
app.post('/api/payment/verify-payment', verifyRazorpaySignature);

// ==========================================
// 8. BUNNY STREAM VIDEO UPLOAD API
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max
});

const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '782211';
const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY || 'c31e8e4b-c1e4-47fc-a0041c72bebc-c8f5-4ead';
const BUNNY_CDN_HOST = process.env.BUNNY_CDN_HOST || 'vz-bb84e70d-4d1.b-cdn.net';

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
