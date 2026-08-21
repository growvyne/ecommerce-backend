import { Review } from "../models/reviewModel.js";
import { Order } from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Add a new review
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment, productId, orderId } = req.body;
    const userId = req.id; // From auth middleware

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required.",
        success: false,
      });
    }

    // 1. Verify user purchased the item (checking orderId directly or array fields)
    let order;
    if (orderId) {
      order = await Order.findOne({ _id: orderId, user: userId });
    } else {
      order = await Order.findOne({
        user: userId,
        $or: [
          { "products.productId": productId },
          { "items.product": productId },
          { products: productId }
        ]
      });
    }

    if (!order) {
      return res.status(400).json({
        message: "You can only review products you have purchased.",
        success: false,
      });
    }

    // OPTIONAL: Uncomment if you want to strictly enforce 'Delivered' status only
    /*
    if (order.status?.toLowerCase() !== "delivered") {
      return res.status(400).json({
        message: "You can only review products after they are delivered.",
        success: false,
      });
    }
    */

    // 2. Check for duplicate reviews
    const alreadyReviewed = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product.",
        success: false,
      });
    }

    // 3. Save review
    const review = await Review.create({
      user: userId,
      product: productId,
      rating: Number(rating),
      comment,
    });

    // 4. Update Product Average Rating & Review Count
    const reviews = await Review.find({ product: productId });
    const avgRating =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: reviews.length,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully!",
      review,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// Fetch reviews for a specific product
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "firstName lastName profilePicUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};