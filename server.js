import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { setupHelmet, setupCors, generalApiLimiter } from './middleware/security.js';
import { requireAdminAuth, logAdminAudit } from './middleware/auth.js';
import { createAdminAuthRouter } from './routes/adminAuthRoutes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import multer from 'multer';
import nodemailer from 'nodemailer';
import compression from 'compression';

// Force public DNS resolution to prevent local ISP SRV resolution issues
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sahilytzxx_db_user:m4J2c1FkGupWeQVa@cluster0.xr4tur3.mongodb.net/kuldeep_studio?retryWrites=true&w=majority&appName=Cluster0';

// Security Middleware: Helmet, CORS allowlist, Cookie Parser, Trust Proxy
app.set('trust proxy', 1);
app.use(setupHelmet());
app.use(setupCors());
app.use(cookieParser());
app.use(generalApiLimiter);
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) return false;
    if (req.path === '/api/events') return false;
    return compression.filter(req, res);
  }
}));
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
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const UPCOMING_COURSES_FILE = path.join(DATA_DIR, 'upcoming_courses.json');
const TESTIMONIALS_FILE = path.join(DATA_DIR, 'testimonials.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'site_settings.json');

const DEFAULT_SITE_SETTINGS = {
  id: 'global_settings',
  fontHeading: 'Playfair Display',
  fontBody: 'Plus Jakarta Sans',
  fontAccent: 'Alex Brush',
  primaryColor: '#E63946',
  goldColor: '#C5A059',
  brandNameFirst: 'KULDEEP',
  brandNameSecond: 'SINGH',
  siteTagline: 'Master Classical Realist & Atelier Founder',
  heroPreTitle: 'The Art of',
  heroMainTitle: 'Artist Kuldeep Singh',
  heroButtonText: 'Discover The Artist',
  statsYearsLabel: 'Years of Devoted Mastery',
  statsYearsValue: '18',
  statsArtworksLabel: 'Original Works Collected',
  statsArtworksValue: '450+',
  statsExhibitionsLabel: 'International Exhibitions',
  statsExhibitionsValue: '24',
  statsStudentsLabel: 'Global Academy Students',
  statsStudentsValue: '5.2K+',
  galleryHeading: 'Acquire Original Paintings & Limited Edition Prints.',
  gallerySubheading: 'Explore authentic museum-grade masterworks hand-crafted with archival minerals, oils, and charcoals. Delivered worldwide with hand-embossed Certificates of Authenticity.',
  aboutStoryHeading: 'A Life Dedicated to the Alchemy of Light, Oil & Form.',
  philosophyQuote: 'Every stroke of oil on linen is a conversation between human patience and natural light.',
  contactEmail: 'artistkuldeepsingh26@gmail.com',
  contactPhone: '+91 88580 60101',
  studioAddress: 'Delhi, India',
  whatsappNumber: '918858060101',
  instagramUrl: 'https://www.instagram.com/artist_kuldeep_singh/',
  youtubeUrl: 'https://www.youtube.com/@artistkuldeepsingh',
  enableParticles: true,
  enableAudioAmbiance: true
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// SEED DATA
// -------------------------------------------------------------

const INITIAL_SEED_ORDERS = [];

const INITIAL_SEED_ARTWORKS = [];

const INITIAL_SEED_STUDENTS = [];

const INITIAL_SEED_COURSES = [];

const INITIAL_REVIEWS = [
  {
    id: 'rev-01',
    name: 'Eleanor Sterling',
    role: 'Contemporary Art Collector & Trustee',
    location: 'Upper East Side, New York',
    artworkImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=900&auto=format&fit=crop',
    artworkAcquired: 'Symphony of the Solitary Tide',
    comment: 'Acquiring an original Kuldeep Singh oil canvas was one of the most rewarding additions to our family collection. The physical presence and luminosity when evening sunlight strikes the canvas is extraordinary.',
    category: 'collector',
    isActive: true
  },
  {
    id: 'rev-02',
    name: 'Marcus Davenport',
    role: 'Interior Architect & Designer',
    location: 'London & Zurich',
    artworkImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=900&auto=format&fit=crop',
    artworkAcquired: 'Echoes of the Florentine Dusk',
    comment: 'The depth of craftsmanship is on par with European museum masters. The framing, documentation, and archival provenance arrived impeccably packed in bespoke wooden crates.',
    category: 'collector',
    isActive: true
  },
  {
    id: 'rev-03',
    name: 'Sophia Chen',
    role: 'Concept Artist & Masterclass Alumna',
    location: 'San Francisco, CA',
    artworkImage: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=900&auto=format&fit=crop',
    courseTaken: 'The Master Oil Painting Diploma',
    comment: 'I had been terrified of oils for years due to drying times and muddy colors. Kuldeep’s breakdown of glazing and split-primary mixing completely revolutionized my workflow. Worth 10x the tuition.',
    category: 'student',
    isActive: true
  },
  {
    id: 'rev-04',
    name: 'Dr. Liam Thorne',
    role: 'Surgeon & Figurative Sketcher',
    location: 'Boston, MA',
    artworkImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=900&auto=format&fit=crop',
    courseTaken: 'Foundations of Realistic Sketching & Human Anatomy',
    comment: 'Kuldeep explains anatomical drawing with the precision of a surgeon and the soul of a poet. In just 4 weeks my charcoal portraits went from flat sketches to three-dimensional sculptural forms.',
    category: 'student',
    isActive: true
  },
  {
    id: 'rev-05',
    name: 'Pooja Verma',
    role: 'Upcoming Venetian Oil Glazing Scholar',
    location: 'New Delhi, India',
    artworkImage: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=900&auto=format&fit=crop',
    courseTaken: 'Venetian Oil Glazing Masterclass',
    comment: 'I pre-booked the Venetian Glazing upcoming batch immediately after seeing Kuldeep Sir’s live demonstration. His knowledge of historical pigments and multi-layered Grisaille is unmatched in India.',
    category: 'upcoming',
    isActive: true
  },
  {
    id: 'rev-06',
    name: 'Rohan Singhania',
    role: 'Architect & Hyper-Realism Alumnus',
    location: 'Mumbai, India',
    artworkImage: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?q=80&w=900&auto=format&fit=crop',
    courseTaken: 'Hyper-Realistic Charcoal Anatomy',
    comment: 'The focus on structural bone landmarks, graphite gradations, and edge control took my architectural sketching to international gallery standards. Kuldeep Sir’s personal feedback on every assignment was incredible.',
    category: 'student',
    isActive: true
  }
];

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

const INITIAL_SEED_USERS = [];

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

// Sync MongoDB collection to JSON file (MongoDB = source of truth, JSON = backup only)
async function syncMongoToJson(Model, jsonFilePath, sortOptions = { _id: -1 }) {
  try {
    if (mongoose.connection.readyState === 1) {
      const projection = {};
      const allDocs = await Model.find({}, projection).sort(sortOptions).lean();
      if (Array.isArray(allDocs) && allDocs.length > 0) {
        const cleaned = allDocs.map(d => {
          const { _id, __v, ...rest } = d;
          return { ...rest, id: rest.id || String(_id), detailImages: Array.isArray(rest.detailImages) ? rest.detailImages : [] };
        });
        writeJsonFile(jsonFilePath, cleaned);
        if (jsonFilePath.includes('artworks') && typeof updateCachedArtworks === 'function') {
          updateCachedArtworks(cleaned);
        }
      }
    }
  } catch (err) {
    console.error(`[SYNC] Error syncing ${jsonFilePath} from MongoDB:`, err.message);
  }
}

// Seeding flag file path - prevents re-seeding deleted data
const SEED_FLAG_FILE = path.join(DATA_DIR, '.seeded_flag');

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

const InquirySchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, default: '' },
  city: { type: String, default: '' },
  status: { type: String, default: 'new' }, // 'new' | 'contacted' | 'resolved'
  source: { type: String, default: 'website_header' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

const InquiryModel = mongoose.model('Inquiry', InquirySchema);

const TestimonialSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, default: '' },
  location: { type: String, default: '' },
  artworkImage: { type: String, default: '' },
  comment: { type: String, required: true },
  category: { type: String, default: 'student' },
  courseTaken: { type: String, default: '' },
  artworkAcquired: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, strict: false });

const TestimonialModel = mongoose.model('Testimonial', TestimonialSchema);

const SiteSettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global_settings', unique: true }
}, { timestamps: true, strict: false });

const SiteSettingsModel = mongoose.model('SiteSettings', SiteSettingsSchema);

let isMongoConnected = false;

async function initMongoDB() {
  try {
    console.log('[BACKEND] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    isMongoConnected = true;
    console.log('✅ [BACKEND] MongoDB Atlas Cloud Database connected successfully!');

    // Only seed from JSON if this is the VERY FIRST time (seed flag not present)
    const isFirstSeed = !fs.existsSync(SEED_FLAG_FILE);

    // Auto-seed Artworks ONLY on first seed & if JSON file has data
    const artCount = await ArtworkModel.countDocuments();
    if (artCount === 0 && isFirstSeed && fs.existsSync(ARTWORKS_FILE)) {
      const existingArt = readJsonFile(ARTWORKS_FILE, []);
      if (existingArt.length > 0) {
        await ArtworkModel.insertMany(existingArt);
        console.log(`[BACKEND] Seeded ${existingArt.length} artworks into MongoDB Atlas`);
      }
    }

    // Auto-seed Courses ONLY on first seed & if JSON has real data
    const courseCount = await CourseModel.countDocuments();
    if (courseCount === 0 && isFirstSeed) {
      const existingCourses = readJsonFile(COURSES_FILE, [])
        .filter(c => !['course-oil-mastery', 'course-realistic-sketching', 'course-watercolor-fluid', 'course-color-alchemy'].includes(c.id));
      if (Array.isArray(existingCourses) && existingCourses.length > 0) {
        await CourseModel.insertMany(existingCourses);
        console.log(`[BACKEND] Seeded ${existingCourses.length} courses into MongoDB Atlas`);
      }
    }

    // Auto-seed Students ONLY on first seed & if JSON file has data
    const studentCount = await StudentModel.countDocuments();
    if (studentCount === 0 && isFirstSeed && fs.existsSync(STUDENTS_FILE)) {
      const existingStudents = readJsonFile(STUDENTS_FILE, [])
        .filter(s => !['stu-101', 'stu-102', 'stu-103', 'stu-104'].includes(s.id));
      if (Array.isArray(existingStudents) && existingStudents.length > 0) {
        await StudentModel.insertMany(existingStudents);
        console.log(`[BACKEND] Seeded ${existingStudents.length} students into MongoDB Atlas`);
      }
    }

    // Auto-seed Orders ONLY on first seed & if JSON file has data
    const orderCount = await OrderModel.countDocuments();
    if (orderCount === 0 && isFirstSeed && fs.existsSync(ORDERS_FILE)) {
      const existingOrders = readJsonFile(ORDERS_FILE, [])
        .filter(o => o.id !== 'ORD_00932');
      if (Array.isArray(existingOrders) && existingOrders.length > 0) {
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

    // Auto-seed Users ONLY on first seed & if JSON file has data
    const userCount = await UserModel.countDocuments();
    if (userCount === 0 && isFirstSeed && fs.existsSync(USERS_FILE)) {
      const existingUsers = readJsonFile(USERS_FILE, [])
        .filter(u => !['usr-student-demo', 'usr-collector-demo'].includes(u.id));
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        await UserModel.insertMany(existingUsers);
        console.log(`[BACKEND] Seeded ${existingUsers.length} users into MongoDB Atlas`);
      }
    }

    // Auto-seed Testimonials: ONLY use real data from JSON, never fake INITIAL_REVIEWS
    const testimonialCount = await TestimonialModel.countDocuments();
    if (testimonialCount === 0 && fs.existsSync(TESTIMONIALS_FILE)) {
      const existing = readJsonFile(TESTIMONIALS_FILE, []);
      if (Array.isArray(existing) && existing.length > 0) {
        await TestimonialModel.insertMany(existing);
        console.log(`[BACKEND] Seeded ${existing.length} testimonials into MongoDB Atlas`);
      }
    }

    // Write seed flag so we never re-seed from stale JSON again
    if (isFirstSeed) {
      fs.writeFileSync(SEED_FLAG_FILE, JSON.stringify({ seededAt: new Date().toISOString() }));
      console.log('✅ [BACKEND] Seed flag written — future restarts will NOT re-seed from JSON files');
    }

    // Permanently purge ALL legacy dummy/test data from MongoDB Atlas
    try {
      await OrderModel.deleteMany({ id: { $in: ['ORD_00932'] } });
      await StudentModel.deleteMany({ id: { $in: ['stu-101', 'stu-102', 'stu-103', 'stu-104'] } });
      await UserModel.deleteMany({ id: { $in: ['usr-student-demo', 'usr-collector-demo'] } });
      await CourseModel.deleteMany({ id: { $in: ['course-oil-mastery', 'course-realistic-sketching', 'course-watercolor-fluid', 'course-color-alchemy', 'course-batch-1792302541776', 'course-batch-1792309037764'] } });
      console.log('🧹 [BACKEND] All legacy dummy data permanently purged from MongoDB Atlas');
    } catch (purgeErr) {
      console.warn('[BACKEND] Legacy purge note:', purgeErr.message);
    }

    // Sync MongoDB → JSON files (MongoDB is source of truth, JSON is emergency backup)
    await syncMongoToJson(ArtworkModel, ARTWORKS_FILE);
    await syncMongoToJson(CourseModel, COURSES_FILE);
    await syncMongoToJson(StudentModel, STUDENTS_FILE);
    await syncMongoToJson(OrderModel, ORDERS_FILE);
    console.log('✅ [BACKEND] JSON backup files synced from MongoDB Atlas');

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
  const message = `data: ${JSON.stringify({ type, payload, data: payload, timestamp: Date.now() })}\n\n`;
  sseClients = sseClients.filter((client) => {
    try {
      if (client.res.writableEnded || client.res.destroyed) return false;
      client.res.write(message);
      return true;
    } catch {
      return false;
    }
  });
}

// Clean up stale SSE connections periodically to prevent memory leaks on Render
setInterval(() => {
  sseClients = sseClients.filter((client) => {
    try {
      if (client.res.writableEnded || client.res.destroyed) return false;
      client.res.write(': keep-alive\n\n');
      return true;
    } catch {
      return false;
    }
  });
}, 25000);

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
    // Security Enforcement: Disallow public administrator self-registration
    const assignedRole = (role === 'admin') ? 'student' : role;
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
    // Security Enforcement: Disallow public administrator self-registration
    const assignedRole = (role === 'admin') ? 'student' : role;
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
// Mount Dedicated Administrator Authentication Router
app.use('/api/admin', createAdminAuthRouter(UserModel, findUserByEmailOrUsername));

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
app.get('/api/users', requireAdminAuth, async (req, res) => {
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
    
    // Prevent non-admin users from escalating to admin or blocking accounts
    if (role === 'admin' || typeof isBlocked === 'boolean') {
      const authHeader = req.headers.authorization || '';
      const cookieToken = req.cookies?.kuldeep_admin_token;
      if (!authHeader && !cookieToken) {
        return res.status(403).json({ success: false, error: 'Unauthorized role modification or administrative action.' });
      }
    }
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
app.delete('/api/users/:id', requireAdminAuth, async (req, res) => {
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

const ALL_DUMMY_COURSE_IDS = ['course-oil-mastery', 'course-realistic-sketching', 'course-watercolor-fluid', 'course-color-alchemy', 'course-batch-1792302541776', 'course-batch-1792309037764'];

const DUMMY_COURSE_IDS = ALL_DUMMY_COURSE_IDS;

let cachedCourses = null;
let lastCoursesCacheTime = 0;

app.get('/api/courses', async (req, res) => {
  const now = Date.now();
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  if (Array.isArray(cachedCourses) && (now - lastCoursesCacheTime < 60000)) {
    return res.json(cachedCourses);
  }
  try {
    if (mongoose.connection.readyState === 1) {
      const courses = await CourseModel.find({ id: { $nin: ALL_DUMMY_COURSE_IDS } }).lean();
      if (Array.isArray(courses)) {
        cachedCourses = courses;
        lastCoursesCacheTime = now;
        return res.json(courses);
      }
    }
  } catch (e) {
    console.error('Mongo courses get error:', e);
  }
  if (Array.isArray(cachedCourses)) return res.json(cachedCourses);
  const courses = readJsonFile(COURSES_FILE, []);
  cachedCourses = courses.filter((c) => !ALL_DUMMY_COURSE_IDS.includes(c.id));
  lastCoursesCacheTime = now;
  res.json(cachedCourses);
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
app.post('/api/courses/:id/modules/:moduleIndex/lectures', requireAdminAuth, async (req, res) => {
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
app.delete('/api/courses/:id/modules/:moduleIndex/lectures/:lectureIndex', requireAdminAuth, async (req, res) => {
  const modIdx = parseInt(req.params.moduleIndex, 10);
  const lecIdx = parseInt(req.params.lectureIndex, 10);
  const targetCourseId = req.params.id;
  const targetLectureId = req.query.lectureId || req.body?.lectureId;
  let updatedCourse;

  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetCourseId }];
      if (mongoose.isValidObjectId(targetCourseId)) conditions.push({ _id: targetCourseId });
      const course = await CourseModel.findOne({ $or: conditions });
      if (course && course.modules && course.modules[modIdx] && course.modules[modIdx].lectures) {
        const deletedLec = targetLectureId
          ? course.modules[modIdx].lectures.find((l) => l.id === targetLectureId)
          : course.modules[modIdx].lectures[lecIdx];
        if (deletedLec?.videoUrl) {
          deleteVideoFromBunny(deletedLec.videoUrl).catch(() => {});
        }

        if (targetLectureId) {
          course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((l) => l.id !== targetLectureId);
        } else {
          course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((_, idx) => idx !== lecIdx);
        }
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
  const courses = readJsonFile(COURSES_FILE, []);
  const course = courses.find((c) => c.id === targetCourseId || c._id === targetCourseId);
  if (course && course.modules && course.modules[modIdx] && course.modules[modIdx].lectures) {
    if (targetLectureId) {
      course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((l) => l.id !== targetLectureId);
    } else {
      course.modules[modIdx].lectures = course.modules[modIdx].lectures.filter((_, idx) => idx !== lecIdx);
    }
    course.modules[modIdx].lessonsCount = course.modules[modIdx].lectures.length;
    course.modules[modIdx].topics = course.modules[modIdx].lectures.map((l) => l.title);
    const total = course.modules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
    course.totalLessons = total;
    writeJsonFile(COURSES_FILE, courses);
    if (!updatedCourse) updatedCourse = course;
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course or lecture not found' });

  broadcastUpdate('LECTURE_DELETED', { courseId: updatedCourse.id, moduleIndex: modIdx, lectureIndex: lecIdx, lectureId: targetLectureId });
  broadcastUpdate('COURSE_UPDATED', updatedCourse);
  res.json({ success: true, course: updatedCourse });
});

// Create New Course / Live Batch
app.post('/api/courses', requireAdminAuth, async (req, res) => {
  if (ALL_DUMMY_COURSE_IDS.includes(req.body?.id)) {
    return res.status(400).json({ error: 'This course has been permanently deleted' });
  }

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
      // FIX: Sync JSON from MongoDB after write (MongoDB = source of truth)
      await syncMongoToJson(CourseModel, COURSES_FILE);
    } else {
      // Offline fallback: write only to JSON
      const courses = readJsonFile(COURSES_FILE, []);
      courses.unshift(newCourse);
      writeJsonFile(COURSES_FILE, courses);
    }
  } catch (e) {
    console.error('Mongo course create error:', e);
    const courses = readJsonFile(COURSES_FILE, []);
    courses.unshift(newCourse);
    writeJsonFile(COURSES_FILE, courses);
  }

  broadcastUpdate('COURSE_ADDED', newCourse);
  console.log(`[BACKEND] New Course Created: "${newCourse.title}" (#${newCourse.id})`);
  res.status(201).json({ success: true, course: newCourse });
});

// Update Course
app.put('/api/courses/:id', requireAdminAuth, async (req, res) => {
  if (ALL_DUMMY_COURSE_IDS.includes(req.params.id)) {
    return res.status(400).json({ error: 'This course has been permanently deleted' });
  }

  let updatedCourse;
  try {
    if (mongoose.connection.readyState === 1) {
      const existing = await CourseModel.findOne({ id: req.params.id }).lean();
      if (!existing) {
        return res.status(404).json({ error: 'Course not found - cannot update deleted course' });
      }
      let updatePayload = { ...req.body, id: req.params.id };

      // If updatePayload explicitly includes modules, respect them and recalculate totalLessons
      if (Array.isArray(updatePayload.modules)) {
        updatePayload.totalLessons = updatePayload.modules.reduce((acc, m) => acc + (Array.isArray(m.lectures) ? m.lectures.length : (m.lessonsCount || 0)), 0);
      } else if (existing && Array.isArray(existing.modules)) {
        // Retain existing modules only if not provided in this update
        updatePayload.modules = existing.modules;
        updatePayload.totalLessons = existing.totalLessons || existing.modules.reduce((acc, m) => acc + (Array.isArray(m.lectures) ? m.lectures.length : (m.lessonsCount || 0)), 0);
      }

      updatedCourse = await CourseModel.findOneAndUpdate(
        { id: req.params.id },
        updatePayload,
        { new: true, upsert: false }
      ).lean();

      // FIX: Sync JSON from MongoDB after write
      await syncMongoToJson(CourseModel, COURSES_FILE);
    } else {
      // Offline fallback: update JSON directly
      const courses = readJsonFile(COURSES_FILE, []);
      const idx = courses.findIndex((c) => c.id === req.params.id);
      if (idx !== -1) {
        const existingC = courses[idx];
        let payload = { ...courses[idx], ...req.body, id: courses[idx].id };
        if (Array.isArray(payload.modules)) {
          payload.totalLessons = payload.modules.reduce((acc, m) => acc + (Array.isArray(m.lectures) ? m.lectures.length : (m.lessonsCount || 0)), 0);
        } else if (existingC && Array.isArray(existingC.modules)) {
          payload.modules = existingC.modules;
          payload.totalLessons = existingC.totalLessons;
        }
        courses[idx] = payload;
        writeJsonFile(COURSES_FILE, courses);
        updatedCourse = courses[idx];
      }
    }
  } catch (e) {
    console.error('Mongo course update error:', e);
  }

  if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });

  broadcastUpdate('COURSE_UPDATED', updatedCourse);
  res.json({ success: true, course: updatedCourse });
});

// Delete Course
app.delete('/api/courses/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      const courseInDb = await CourseModel.findOne({ $or: conditions }).lean();
      if (courseInDb?.modules) {
        for (const mod of courseInDb.modules) {
          if (Array.isArray(mod.lectures)) {
            for (const lec of mod.lectures) {
              if (lec.videoUrl) deleteVideoFromBunny(lec.videoUrl).catch(() => {});
            }
          }
        }
      }
      await CourseModel.deleteMany({ $or: conditions });
      // FIX: Sync JSON from MongoDB after delete (so JSON never has deleted courses)
      await syncMongoToJson(CourseModel, COURSES_FILE);
    } else {
      // Offline fallback
      const courses = readJsonFile(COURSES_FILE, []);
      const targetCourse = courses.find((c) => c.id === targetId || c._id === targetId);
      if (targetCourse?.modules) {
        for (const mod of targetCourse.modules) {
          if (Array.isArray(mod.lectures)) {
            for (const lec of mod.lectures) {
              if (lec.videoUrl) deleteVideoFromBunny(lec.videoUrl).catch(() => {});
            }
          }
        }
      }
      const filtered = courses.filter((c) => c.id !== targetId && c._id !== targetId);
      writeJsonFile(COURSES_FILE, filtered);
    }
  } catch (e) {
    console.error('Mongo course delete error:', e);
  }

  broadcastUpdate('COURSE_DELETED', { id: targetId });
  res.json({ success: true, message: `Course ${targetId} deleted` });
});

// ==========================================
// 2.5 UPCOMING COURSES API
// ==========================================

app.get('/api/upcoming-courses', async (req, res) => {
  const upcoming = readJsonFile(UPCOMING_COURSES_FILE, []);
  res.json({ success: true, count: upcoming.length, upcomingCourses: upcoming });
});

app.post('/api/upcoming-courses', requireAdminAuth, async (req, res) => {
  const newCourse = req.body;
  if (!newCourse.id) {
    newCourse.id = 'up-course-' + Date.now();
  }
  const upcoming = readJsonFile(UPCOMING_COURSES_FILE, []);
  upcoming.unshift(newCourse);
  writeJsonFile(UPCOMING_COURSES_FILE, upcoming);

  broadcastUpdate('UPCOMING_COURSE_CREATED', newCourse);
  res.status(201).json({ success: true, upcomingCourse: newCourse });
});

app.put('/api/upcoming-courses/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  const updates = req.body;
  const upcoming = readJsonFile(UPCOMING_COURSES_FILE, []);
  const idx = upcoming.findIndex((c) => c.id === targetId);
  if (idx !== -1) {
    upcoming[idx] = { ...upcoming[idx], ...updates };
    writeJsonFile(UPCOMING_COURSES_FILE, upcoming);
    broadcastUpdate('UPCOMING_COURSE_UPDATED', upcoming[idx]);
    res.json({ success: true, upcomingCourse: upcoming[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Upcoming course not found' });
  }
});

app.delete('/api/upcoming-courses/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  const upcoming = readJsonFile(UPCOMING_COURSES_FILE, []);
  const filtered = upcoming.filter((c) => c.id !== targetId);
  writeJsonFile(UPCOMING_COURSES_FILE, filtered);

  broadcastUpdate('UPCOMING_COURSE_DELETED', { id: targetId });
  res.json({ success: true, message: `Upcoming course ${targetId} deleted` });
});

// ==========================================
// 2.6 TESTIMONIALS & REVIEWS API
// ==========================================

app.get('/api/testimonials', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const list = await TestimonialModel.find().sort({ createdAt: -1, _id: -1 }).lean();
      if (Array.isArray(list) && list.length > 0) {
        return res.json({ success: true, count: list.length, testimonials: list });
      }
    }
  } catch (e) {
    console.error('Mongo testimonials get error:', e);
  }
  const testimonials = readJsonFile(TESTIMONIALS_FILE, INITIAL_REVIEWS);
  res.json({ success: true, count: testimonials.length, testimonials });
});

app.post('/api/testimonials', requireAdminAuth, async (req, res) => {
  const newTestimonial = { ...req.body };
  if (!newTestimonial.id) {
    newTestimonial.id = 'rev-' + Date.now();
  }
  try {
    if (mongoose.connection.readyState === 1) {
      await TestimonialModel.findOneAndUpdate(
        { id: newTestimonial.id },
        newTestimonial,
        { upsert: true, new: true }
      );
    }
  } catch (e) {
    console.error('Mongo testimonial create error:', e);
  }

  const testimonials = readJsonFile(TESTIMONIALS_FILE, []);
  testimonials.unshift(newTestimonial);
  writeJsonFile(TESTIMONIALS_FILE, testimonials);

  broadcastUpdate('TESTIMONIAL_CREATED', newTestimonial);
  res.status(201).json({ success: true, testimonial: newTestimonial });
});

app.put('/api/testimonials/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  const updates = { ...req.body, id: targetId };
  let updated;

  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      updated = await TestimonialModel.findOneAndUpdate(
        { $or: conditions },
        updates,
        { upsert: true, new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo testimonial update error:', e);
  }

  const testimonials = readJsonFile(TESTIMONIALS_FILE, []);
  const idx = testimonials.findIndex((t) => t.id === targetId || String(t._id) === targetId);
  if (idx !== -1) {
    testimonials[idx] = { ...testimonials[idx], ...updates };
    if (!updated) updated = testimonials[idx];
  } else {
    testimonials.push(updates);
    if (!updated) updated = updates;
  }
  writeJsonFile(TESTIMONIALS_FILE, testimonials);

  broadcastUpdate('TESTIMONIAL_UPDATED', updated);
  res.json({ success: true, testimonial: updated });
});

app.delete('/api/testimonials/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      await TestimonialModel.deleteMany({ $or: conditions });
    }
  } catch (e) {
    console.error('Mongo testimonial delete error:', e);
  }

  const testimonials = readJsonFile(TESTIMONIALS_FILE, []);
  const filtered = testimonials.filter((t) => t.id !== targetId && String(t._id) !== targetId);
  writeJsonFile(TESTIMONIALS_FILE, filtered);

  broadcastUpdate('TESTIMONIAL_DELETED', { id: targetId });
  res.json({ success: true, message: `Testimonial ${targetId} deleted` });
});

// ==========================================
// 3. STUDENTS & ENROLLMENTS API
// ==========================================

app.get('/api/students', requireAdminAuth, async (req, res) => {
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

app.post('/api/students', requireAdminAuth, async (req, res) => {
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
    paymentSource: req.body.paymentSource || 'admin',
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

  // Auto-sync with UserModel so student's website login gets instant course & video access
  try {
    if (mongoose.connection.readyState === 1 && savedStudent && savedStudent.email && savedStudent.courseId) {
      await UserModel.findOneAndUpdate(
        { email: savedStudent.email.toLowerCase() },
        { 
          $addToSet: { enrolledCourseIds: savedStudent.courseId },
          $setOnInsert: {
            id: `usr_${Date.now()}`,
            name: savedStudent.name,
            email: savedStudent.email.toLowerCase(),
            username: savedStudent.username || savedStudent.email.split('@')[0],
            plainPassword: savedStudent.plainPassword || 'art123456',
            role: 'student',
            isEmailVerified: true
          }
        },
        { upsert: true }
      );
      console.log(`[BACKEND] Linked course ${savedStudent.courseId} to User account ${savedStudent.email}`);
    }
  } catch (userSyncErr) {
    console.error('Error linking user course access:', userSyncErr.message);
  }
  broadcastUpdate('STUDENT_ENROLLED', savedStudent);
  console.log(`[BACKEND] Student Enrolled: ${savedStudent.name} (${savedStudent.courseTitle})`);
  res.status(201).json({ success: true, student: savedStudent });
});

app.put('/api/students/:id', requireAdminAuth, async (req, res) => {
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

app.delete('/api/students/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      const foundStudent = await StudentModel.findOne({ $or: conditions }).lean();
      await StudentModel.deleteMany({ $or: conditions });
      if (foundStudent && foundStudent.email) {
        await UserModel.updateMany(
          { email: foundStudent.email.toLowerCase() },
          { $pull: { enrolledCourseIds: foundStudent.courseId } }
        );
      }
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

// In-memory cache for ultra-fast instant responses (<5ms)
let cachedArtworks = readJsonFile(ARTWORKS_FILE, []);

function updateCachedArtworks(newList) {
  if (Array.isArray(newList) && newList.length > 0) {
    cachedArtworks = newList;
  }
}

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    artworksCount: cachedArtworks.length,
    mongoReadyState: mongoose.connection.readyState
  });
});

// Helper to strip heavy detailImages from list view for ultra-fast mobile loading
function getLightweightArtworks(list) {
  if (!Array.isArray(list)) return [];
  return list.map((a) => {
    // Only return detailImagesCount instead of megabytes of base64
    const { detailImages, ...rest } = a;
    return {
      ...rest,
      detailImages: [],
      detailImagesCount: Array.isArray(detailImages) ? detailImages.length : 0
    };
  });
}

app.get('/api/artworks', async (req, res) => {
  // Check if client explicitly asks for full details (?full=true)
  const isFullRequested = req.query.full === 'true';

  if (Array.isArray(cachedArtworks) && cachedArtworks.length > 0) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return res.json(isFullRequested ? cachedArtworks : getLightweightArtworks(cachedArtworks));
  }
  try {
    if (mongoose.connection.readyState === 1) {
      const artworks = await ArtworkModel.find({}).sort({ _id: -1 }).lean();
      if (Array.isArray(artworks) && artworks.length > 0) {
        cachedArtworks = artworks.map((d) => {
          const { _id, __v, ...rest } = d;
          return { ...rest, id: rest.id || String(_id), detailImages: Array.isArray(rest.detailImages) ? rest.detailImages : [] };
        });
        writeJsonFile(ARTWORKS_FILE, cachedArtworks);
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        return res.json(isFullRequested ? cachedArtworks : getLightweightArtworks(cachedArtworks));
      }
    }
  } catch (e) {
    console.error('Mongo artworks get error:', e.message);
  }
  const artworks = readJsonFile(ARTWORKS_FILE, []);
  cachedArtworks = artworks;
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json(isFullRequested ? artworks : getLightweightArtworks(artworks));
});

app.get('/api/artworks/:id', async (req, res) => {
  const targetId = req.params.id;
  // First check in-memory cache
  const item = cachedArtworks.find((a) => a.id === targetId || String(a._id) === targetId);
  if (item) {
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.json(item);
  }
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      const mongoItem = await ArtworkModel.findOne({ $or: conditions }).lean();
      if (mongoItem) {
        res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
        return res.json(mongoItem);
      }
    }
  } catch (e) {
    console.error('Mongo artwork get error:', e.message);
  }
  res.status(404).json({ error: 'Artwork not found' });
});

app.post('/api/artworks', requireAdminAuth, async (req, res) => {
  const body = req.body;
  const DUMMY_ART_IDS = ['art-01', 'art-02', 'art-03', 'art-04', 'art-05', 'art-06', 'art-07', 'art-08'];
  if (DUMMY_ART_IDS.includes(body.id)) {
    return res.status(400).json({ error: 'Dummy artwork cannot be created or restored' });
  }

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
    varnishType: body.varnishType || 'Archival Satin Varnish',
    createdAt: new Date().toISOString()
  };

  // 1. Immediately update in-memory cache
  const existingIdx = cachedArtworks.findIndex((a) => a.id === newArtwork.id);
  if (existingIdx !== -1) {
    cachedArtworks[existingIdx] = newArtwork;
  } else {
    cachedArtworks.unshift(newArtwork);
  }

  // 2. Persist to local JSON file
  writeJsonFile(ARTWORKS_FILE, cachedArtworks);

  // 3. Real-time broadcast to all clients
  broadcastUpdate('ARTWORK_CREATED', newArtwork);
  console.log(`[BACKEND] New Artwork Added: "${newArtwork.title}" (#${newArtwork.id}) - ₹${newArtwork.price}`);

  // 4. Return success immediately (zero delay!)
  res.status(201).json({ success: true, artwork: newArtwork });

  // 5. Asynchronously persist to MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    ArtworkModel.findOneAndUpdate({ id: newArtwork.id }, newArtwork, { upsert: true }).catch((e) =>
      console.error('Async Mongo artwork insert error:', e.message)
    );
  }
});

// Reorder Artworks (Sequence Adjust)
app.post('/api/artworks/reorder', requireAdminAuth, async (req, res) => {
  const { artworkIds, mainArtworkId } = req.body;
  if (!Array.isArray(artworkIds)) {
    return res.status(400).json({ error: 'artworkIds array is required' });
  }

  // Create a quick lookup map of existing artworks
  const map = new Map();
  for (const art of cachedArtworks) {
    map.set(art.id, art);
    if (art._id) map.set(String(art._id), art);
  }

  const reordered = [];
  artworkIds.forEach((id, idx) => {
    const existing = map.get(id);
    if (existing) {
      existing.order = idx + 1;
      if (mainArtworkId !== undefined) {
        existing.isMain = (existing.id === mainArtworkId || String(existing._id) === mainArtworkId);
      }
      reordered.push(existing);
      map.delete(id);
      if (existing._id) map.delete(String(existing._id));
    }
  });

  // Append any artworks not mentioned in the reorder payload
  for (const remaining of map.values()) {
    if (!reordered.some(a => a.id === remaining.id)) {
      remaining.order = (remaining.order || 999);
      if (mainArtworkId !== undefined) {
        remaining.isMain = (remaining.id === mainArtworkId || String(remaining._id) === mainArtworkId);
      }
      reordered.push(remaining);
    }
  }

  cachedArtworks = reordered;
  writeJsonFile(ARTWORKS_FILE, cachedArtworks);
  broadcastUpdate('ARTWORKS_REORDERED', { artworks: cachedArtworks, mainArtworkId });
  console.log('[BACKEND] Artworks Reordered successfully (' + reordered.length + ' artworks). Main: ' + (mainArtworkId || 'none'));
  res.json({ success: true, artworks: cachedArtworks });

  // Async bulk persist to MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      const bulkOps = reordered.map((art, idx) => ({
        updateOne: {
          filter: { id: art.id },
          update: { $set: { order: idx + 1, isMain: Boolean(art.isMain) } }
        }
      }));
      if (bulkOps.length > 0) {
        ArtworkModel.bulkWrite(bulkOps).catch(e => console.error('Mongo bulkWrite reorder error:', e.message));
      }
    } catch (err) {
      console.error('Mongo reorder bulk error:', err);
    }
  }
});

app.put('/api/artworks/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  const idx = cachedArtworks.findIndex((a) => a.id === targetId || String(a._id) === targetId);
  if (idx !== -1) {
    const updated = { ...cachedArtworks[idx], ...req.body, id: cachedArtworks[idx].id, updatedAt: new Date().toISOString() };
    cachedArtworks[idx] = updated;
    writeJsonFile(ARTWORKS_FILE, cachedArtworks);
    broadcastUpdate('ARTWORK_UPDATED', updated);
    res.json({ success: true, artwork: updated });

    if (mongoose.connection.readyState === 1) {
      ArtworkModel.findOneAndUpdate({ id: targetId }, { ...req.body, id: targetId }, { new: true }).catch((e) =>
        console.error('Async Mongo artwork update error:', e.message)
      );
    }
  } else {
    res.status(404).json({ error: 'Artwork not found' });
  }
});

app.delete('/api/artworks/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  cachedArtworks = cachedArtworks.filter((a) => a.id !== targetId && String(a._id) !== targetId);
  writeJsonFile(ARTWORKS_FILE, cachedArtworks);
  broadcastUpdate('ARTWORK_DELETED', { id: targetId });
  console.log(`[BACKEND] Artwork Permanently Deleted: ${targetId}`);
  res.json({ success: true, id: targetId });

  if (mongoose.connection.readyState === 1) {
    const conditions = [{ id: targetId }];
    if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
    ArtworkModel.deleteMany({ $or: conditions }).catch((e) =>
      console.error('Async Mongo artwork delete error:', e.message)
    );
  }
});

// ==========================================
// 5. ORDERS API
// ==========================================

app.get('/api/orders', requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await OrderModel.find().sort({ createdAt: -1, _id: -1 }).lean();
      return res.json(orders || []);
    }
  } catch (e) {
    console.error('Mongo orders get error:', e);
  }
  const orders = readJsonFile(ORDERS_FILE, []);
  res.json(orders);
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: req.params.id }];
      if (mongoose.isValidObjectId(req.params.id)) conditions.push({ _id: req.params.id });
      const order = await OrderModel.findOne({ $or: conditions }).lean();
      if (order) return res.json(order);
    }
  } catch (e) {
    console.error('Mongo order get error:', e);
  }
  const orders = readJsonFile(ORDERS_FILE, []);
  const order = orders.find((o) => o.id === req.params.id || String(o._id) === req.params.id);
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
          paymentSource: 'razorpay',
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

app.put('/api/orders/:id', requireAdminAuth, async (req, res) => {
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

app.delete('/api/orders/:id', requireAdminAuth, async (req, res) => {
  const targetId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1) {
      const conditions = [{ id: targetId }];
      if (mongoose.isValidObjectId(targetId)) conditions.push({ _id: targetId });
      await OrderModel.deleteMany({ $or: conditions });
    }
  } catch (e) {
    console.error('Mongo order delete error:', e);
  }

  const orders = readJsonFile(ORDERS_FILE, []);
  const filtered = orders.filter((o) => o.id !== targetId && String(o._id) !== targetId);
  writeJsonFile(ORDERS_FILE, filtered);

  broadcastUpdate('ORDER_DELETED', { id: targetId });
  console.log(`[BACKEND] Order Permanently Deleted: ${targetId}`);
  res.json({ success: true, id: targetId });
});

app.delete('/api/orders', requireAdminAuth, async (req, res) => {
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

// ==========================================
// SITE SETTINGS (100% Control: Fonts, Headings, Texts, Colors, Branding)
// ==========================================
app.get('/api/settings', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let settings = await SiteSettingsModel.findOne({ id: 'global_settings' }).lean();
      if (!settings) {
        settings = await SiteSettingsModel.create(DEFAULT_SITE_SETTINGS);
      }
      return res.json(settings);
    }
  } catch (e) {
    console.error('Mongo settings get error:', e);
  }
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SITE_SETTINGS);
  res.json(settings);
});

app.put('/api/settings', requireAdminAuth, async (req, res) => {
  let updated;
  try {
    if (mongoose.connection.readyState === 1) {
      updated = await SiteSettingsModel.findOneAndUpdate(
        { id: 'global_settings' },
        { ...req.body, id: 'global_settings' },
        { upsert: true, new: true }
      ).lean();
    }
  } catch (e) {
    console.error('Mongo settings update error:', e);
  }

  const current = readJsonFile(SETTINGS_FILE, DEFAULT_SITE_SETTINGS);
  const merged = { ...current, ...req.body, id: 'global_settings' };
  writeJsonFile(SETTINGS_FILE, merged);
  if (!updated) updated = merged;

  broadcastUpdate('SETTINGS_UPDATED', updated);
  console.log('[BACKEND] Global Site Settings & Typography Updated');
  res.json({ success: true, settings: updated });
});

app.put('/api/profile', requireAdminAuth, async (req, res) => {
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
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TpFxRsfihf9Itb';
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '3niiRU2IkvdMlcsSwDuq1YVM';

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
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '3niiRU2IkvdMlcsSwDuq1YVM';

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
app.post('/api/upload/bunny-token', requireAdminAuth, async (req, res) => {
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

app.post('/api/upload/video', requireAdminAuth, upload.single('video'), async (req, res) => {
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

// Helper to extract Bunny Video GUID from any URL or string
function extractBunnyVideoId(urlOrGuid) {
  if (!urlOrGuid || typeof urlOrGuid !== 'string') return null;
  const match = urlOrGuid.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  return match ? match[0] : null;
}

// Function to delete video from Bunny Stream CDN
async function deleteVideoFromBunny(videoIdOrUrl) {
  const videoId = extractBunnyVideoId(videoIdOrUrl);
  if (!videoId) return { success: false, reason: 'Invalid or non-Bunny video ID' };

  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'accept': 'application/json'
      }
    });

    if (res.ok) {
      console.log(`✅ [BUNNY STREAM] Video permanently deleted from CDN: ${videoId}`);
      return { success: true, videoId };
    } else {
      const errText = await res.text();
      console.warn(`⚠️ [BUNNY STREAM] Delete warning for ${videoId}: ${res.status} ${errText}`);
      return { success: false, status: res.status, error: errText };
    }
  } catch (err) {
    console.error(`❌ [BUNNY STREAM] Delete exception for ${videoId}:`, err);
    return { success: false, error: err.message };
  }
}

// DELETE endpoint for Bunny Videos (by ID in URL or query)
app.delete('/api/upload/bunny-video/:videoId', requireAdminAuth, async (req, res) => {
  const result = await deleteVideoFromBunny(req.params.videoId);
  res.json(result);
});

// POST endpoint for Bunny Video Deletion (accepts { videoId } or { videoUrl })
app.post('/api/upload/bunny-delete', requireAdminAuth, async (req, res) => {
  const target = req.body.videoId || req.body.videoUrl;
  if (!target) {
    return res.status(400).json({ error: 'videoId or videoUrl is required' });
  }
  const result = await deleteVideoFromBunny(target);
  res.json(result);
});

// -------------------------------------------------------------
// 10. INQUIRIES & LEADS API
// -------------------------------------------------------------

app.get('/api/inquiries', requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const inquiries = await InquiryModel.find().sort({ createdAt: -1 }).lean();
      return res.json(inquiries || []);
    }
  } catch (err) {
    console.error('Mongo get inquiries error:', err);
  }
  const list = readJsonFile(INQUIRIES_FILE, []);
  res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const newInquiry = {
      id: req.body.id || `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (req.body.name || '').trim(),
      email: (req.body.email || '').trim().toLowerCase(),
      phone: (req.body.phone || '').trim(),
      subject: (req.body.subject || 'General Inquiry').trim(),
      message: (req.body.message || '').trim(),
      city: (req.body.city || '').trim(),
      status: 'new',
      source: req.body.source || 'website_header',
      createdAt: new Date().toISOString()
    };

    if (!newInquiry.name || !newInquiry.phone) {
      return res.status(400).json({ error: 'Name and Phone number are required' });
    }

    let saved = null;
    if (mongoose.connection.readyState === 1) {
      saved = await InquiryModel.create(newInquiry);
    }

    const list = readJsonFile(INQUIRIES_FILE, []);
    list.unshift(saved ? saved.toObject() : newInquiry);
    writeJsonFile(INQUIRIES_FILE, list);

    broadcastUpdate('INQUIRY_CREATED', saved ? saved.toObject() : newInquiry);
    console.log(`📩 [INQUIRY] New customer inquiry from ${newInquiry.name} (${newInquiry.phone})!`);

    res.status(201).json({ success: true, inquiry: saved ? saved.toObject() : newInquiry });
  } catch (err) {
    console.error('Save inquiry error:', err);
    res.status(500).json({ error: 'Failed to record inquiry', details: err.message });
  }
});

app.put('/api/inquiries/:id', requireAdminAuth, async (req, res) => {
  try {
    let updated = null;
    if (mongoose.connection.readyState === 1) {
      updated = await InquiryModel.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body },
        { new: true }
      ).lean();
    }

    const list = readJsonFile(INQUIRIES_FILE, []);
    const idx = list.findIndex((i) => i.id === req.params.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...req.body };
      writeJsonFile(INQUIRIES_FILE, list);
      if (!updated) updated = list[idx];
    }

    if (!updated) return res.status(404).json({ error: 'Inquiry not found' });
    broadcastUpdate('INQUIRY_UPDATED', updated);
    res.json({ success: true, inquiry: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

app.delete('/api/inquiries/:id', requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await InquiryModel.deleteOne({ id: req.params.id });
    }
    const list = readJsonFile(INQUIRIES_FILE, []);
    writeJsonFile(INQUIRIES_FILE, list.filter((i) => i.id !== req.params.id));
    broadcastUpdate('INQUIRY_DELETED', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port ' + PORT);
  });
}

export default app;
// old: app.listen(
  console.log(`====================================================`);
  console.log(`🎨 Artist Kuldeep Singh 24/7 Complete Cloud API Online!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`☁️ Database: MongoDB Atlas (Cluster0)`);
  console.log(`💳 Razorpay Gateway: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Demo Simulator Active'}`);
  console.log(`====================================================`);
});

// 24/7 Keep-Alive self-pulse (Keeps Render instance warm & responsive)
setInterval(() => {
  const pingUrl = `https://kuldeep-singh-backend-nehy.onrender.com/api/ping`;
  fetch(pingUrl)
    .then((r) => r.json())
    .then(() => console.log('⚡ [24/7 KEEP-ALIVE] Render warm-pulse confirmed'))
    .catch(() => {});
}, 5 * 60 * 1000); // Pulse every 5 minutes
