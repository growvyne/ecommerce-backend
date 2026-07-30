import mongoose from "mongoose";

const connectDB = async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/happyzing`);
        console.log("Connected to MongoDB successfully");
    }catch(error){
        console.error("Failed connecting to MongoDB:", error);
        process.exit(1); 
    }
}

export default connectDB;