import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    // Payment status tracking
    status: {
      type: String,
      enum: ["Pending", "Paid", "paid", "Failed"],
      default: "Pending",
    },

    // Fulfillment status managed by Admin
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Order Accepted",
        "Order Placed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // Timeline for tracking status changes
    statusHistory: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // Razorpay Fields
    razorpay_order_id: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);