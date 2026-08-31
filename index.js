const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require('./src/routes/routes.js'); 

const app = express();
const port = process.env.PORT || 3000;

// CORS CONFIG
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'https://hoppscotch.io',
  'https://eco-system-gamma.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.hoppscotch.io')) {
      callback(null, true);
    } else {
      callback(null, true); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  optionsSuccessStatus: 204
}));

app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MONTAJE DE RUTAS
app.use('/api', userRoutes);

// Only run a real listening server outside of Vercel's serverless runtime.
// Vercel invokes this module as a function per-request; it never needs app.listen().
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;