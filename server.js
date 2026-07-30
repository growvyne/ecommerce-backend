import express from 'express';
import 'dotenv/config';
import connectDB from './database/db.js';
import cors from 'cors'
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoute from './routes/cartRoutes.js'
// import catagory from './routes/catagoryRoutes.js'

const app = express();
const PORT=process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

app.use('/api/v1/user',userRoutes);
app.use('/api/v1/product',productRoutes);
app.use('/api/v1/cart',cartRoute);
// app.use('/api/v1/category',catagory)
//http://localhost:3000/api/v1/user/register


// console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("Secret Exists:", !!process.env.CLOUDINARY_API_SECRET);


app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})