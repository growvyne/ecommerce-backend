import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Recommended since products should belong to a vendor/user
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    catagory: {
  type: String,
  required: [true, "Category is required"],
  trim: true
  // enum array removed so any category text works!
},
    productDesc: {
      type: String,
      required: true,
      trim: true,
    },
    productStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    productImg: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    productPrice: { 
      type: Number,
      required: true, // Made required as price shouldn't be empty
      min: [0, "Price cannot be negative"],
    },
    brand: { 
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Check if model already exists to prevent compilation errors during hot reloads
export default mongoose.models.Product || mongoose.model("Product", productSchema);