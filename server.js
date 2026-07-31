import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import cors from 'cors'
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoute from './routes/cartRoutes.js'

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS MUST GO FIRST
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.1.6:5173", // your current local network IP
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS not allowed for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// 2. Body parsers come AFTER CORS
app.use(express.json());

// 3. Your Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/cart', cartRoute);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})