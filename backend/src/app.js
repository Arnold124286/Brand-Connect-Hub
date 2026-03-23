require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const { createServer } = require('http');
const { Server }       = require('socket.io');

const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const bidsRouter = require('./routes/bids');
const apiRouter  = require('./routes/api');

const app    = express();
const server = createServer(app);

// ─── Socket.IO (real-time messaging & notifications) ──────────────────────────

const io = new Server(server, {
  cors: {
    origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('sendMessage', async (data) => {
    // Emit to receiver's room
    io.to(`user:${data.receiverId}`).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Make io available in routes
app.set('io', io);

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',     authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/bids',     bidsRouter);
app.use('/api',          apiRouter);

// ─── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Brand Connect Hub API',
  });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ──────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Brand Connect Hub API running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.IO enabled for real-time messaging\n`);
});

module.exports = { app, server };
