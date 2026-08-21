import express from 'express';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import connectDB from './database/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoute from './routes/cartRoutes.js';
import OrderRoute from './routes/orderRoutes.js';
import reviewRoute from './routes/reviewRoute.js'

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.1.6:5173",
  "https://happizing-frontend.vercel.app"
];

// 2. CORS Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// 3. Body parsers
app.use(express.json());

// 4. Create HTTP Server & Initialize Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Attach `io` instance to Express `app` so controllers can access it via req.app.get("io")
app.set("io", io);

// 5. Socket.io Connection & Room Logic
io.on("connection", (socket) => {
  console.log("⚡ New Socket Client Connected:", socket.id);

  // Customer joins personal notification room
  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 Socket ${socket.id} joined room: user_${userId}`);
    }
  });

  // Admin joins global admin notification room
  socket.on("join_admin_room", () => {
    socket.join("admin_room");
    console.log(`👑 Socket ${socket.id} joined room: admin_room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Client Disconnected:", socket.id);
  });
});

// 6. Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/cart', cartRoute);
app.use('/api/v1/orders', OrderRoute);
app.use('/api/v1/review', reviewRoute);

// 7. Start HTTP Server (Use `server.listen` instead of `app.listen`)
server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
});