import razorpayInstance from "../config/razorpay.js";
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import Product from "../models/productModel.js";
import { Cart } from "../models/cartModel.js";
import { sendAdminOrderEmail } from "../utils/sendMail.js";
import crypto from "crypto";
import PDFDocument from 'pdfkit';

export const createOrder = async (req, res) => {
  try {
    const { amount, products, tax, shipping, currency, address } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Minimum order amount is ₹1.",
      });
    }

    const amountInPaise = Math.round(numericAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const newOrder = new Order({
      user: req.user._id,
      products,
      amount: numericAmount,
      tax,
      shipping,
      currency: currency || "INR",
      status: "Pending",
      razorpay_order_id: razorpayOrder.id,
      address,
    });
    
    await newOrder.save();

    // Socket notification
    const io = req.app.get("io");
    if (io && newOrder) {
      io.to("admin_room").emit("new_order_admin_alert", {
        orderId: newOrder._id,
        customerName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || "Customer",
        amount: numericAmount,
        status: "Pending",
      });
    }

    return res.status(201).json({
      success: true,
      order: razorpayOrder,
      dbOrder: newOrder,
    });
  } catch (error) {
    console.error("Error in create order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentFailed,
    } = req.body;

    const userId = req.user._id;
    const io = req.app.get("io");

    if (paymentFailed) {
      const order = await Order.findOneAndUpdate(
        { razorpay_order_id },
        { status: "Failed" },
        { new: true }
      );

      if (io && order) {
        io.to(`user_${userId}`).emit("order_payment_failed", {
          orderId: order._id,
          message: "Payment failed or was cancelled.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Payment failed or cancelled",
        order,
      });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature === expectedSignature) {
      // 1. Update Order Status
   // Inside verifyPayment:
const order = await Order.findOneAndUpdate(
  { razorpay_order_id },
  {
    status: "paid",
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  },
  { returnDocument: 'after' }
);

await Cart.findOneAndUpdate(
  { $or: [{ user: userId }, { userId }] },
  { $set: { items: [], totalPrice: 0 } },
  { returnDocument: 'after' }
);

      // 3. Fetch Full User Details for Clean Email Formatting
      const userDetails = await User.findById(userId).select("firstName lastName email");
      const customerName = `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userDetails?.email || "Customer";

      // 4. Send Email Notification to Admin (WITH AWAIT & CATCH)
      try {
        await sendAdminOrderEmail({
          orderId: order._id,
          customerName,
          customerEmail: userDetails?.email,
          amount: order.amount,
          status: "Paid",
        });
        console.log(`✉️ Email successfully dispatched for Order #${order._id}`);
      } catch (mailErr) {
        console.error("❌ Nodemailer failed to send order email:", mailErr.message);
      }

      // 5. Emit Socket Alerts
      if (io && order) {
        io.to(`user_${userId}`).emit("order_placed_success", {
          orderId: order._id,
          amount: order.amount,
          message: "Payment verified! Your order has been placed successfully.",
        });

        io.to("admin_room").emit("new_order_admin_alert", {
          orderId: order._id,
          customerName,
          amount: order.amount,
          status: "Paid",
        });
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
        order,
      });
    } else {
      await Order.findOneAndUpdate(
        { razorpay_order_id },
        { status: "Failed" },
        { new: true }
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during verification",
    });
  }
};

export const getMyOrder = async (req, res) => {
  try {
    const userId = req.id; 

    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg",
      })
      .populate("user", "firstName lastName email");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg",
      })
      .populate("user", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.log("Error fetching user order:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.productId", "productName productPrice");

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});

    const paidFilter = { status: { $regex: /^paid$/i } };

    const totalOrders = await Order.countDocuments(paidFilter);

    const totalSalesAgg = await Order.aggregate([
      { $match: paidFilter },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $toDouble: {
                $ifNull: ["$amount", { $ifNull: ["$totalAmount", "$totalPrice"] }]
              }
            }
          }
        }
      }
    ]);

    const totalSales = totalSalesAgg[0]?.total || 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDate = await Order.aggregate([
      {
        $match: {
          ...paidFilter,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          totalSales: {
            $sum: {
              $toDouble: {
                $ifNull: ["$amount", { $ifNull: ["$totalAmount", "$totalPrice"] }]
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      totalUsers,
      totalProducts,
      totalOrders,
      totalSales,
      salesByDate
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email address city state zipCode')
      .populate('products.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    const reqUserId = req.user?._id?.toString();

    if (orderUserId !== reqUserId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order._id}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(12).text('Your Store Name', 50, 50);
    doc.fontSize(10).text('123 Business Street, Tech City', 50, 65);
    doc.text('Email: support@yourstore.com', 50, 80);
    doc.moveDown(2);

    const customerName =
      [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') || 'Customer';

    doc
      .fontSize(10)
      .text(`Invoice No: INV-${order._id.toString().slice(-6).toUpperCase()}`, 50, 110)
      .text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 50, 125)
      .text(`Status: ${order.status || order.orderStatus || 'Paid'}`, 50, 140);

    doc
      .text(`Billed To:`, 350, 110)
      .text(customerName, 350, 125)
      .text(order.user?.address || 'N/A', 350, 140)
      .text(`${order.user?.city || ''} ${order.user?.zipCode || ''}`, 350, 155);

    doc.moveDown(3);

    const tableTop = 200;
    doc.font('Helvetica-Bold');
    doc.text('Item Description', 50, tableTop);
    doc.text('Qty', 280, tableTop, { width: 50, align: 'center' });
    doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
    doc.text('Total', 450, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#e5e7eb');
    doc.font('Helvetica');

    let position = tableTop + 25;
    const orderProducts = order.products || [];

    orderProducts.forEach((item) => {
      const prodObj = item.productId || {};
      const itemName = prodObj.productName || prodObj.name || item.name || 'Ordered Product';
      const qty = item.quantity || item.qty || 1;
      const price = prodObj.productPrice || prodObj.price || item.price || 0;
      const itemTotal = qty * price;

      doc.text(itemName, 50, position, { width: 220 });
      doc.text(qty.toString(), 280, position, { width: 50, align: 'center' });
      doc.text(`₹${price.toLocaleString('en-IN')}`, 350, position, { width: 80, align: 'right' });
      doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, 450, position, { width: 80, align: 'right' });

      position += 20;
    });

    doc.moveTo(50, position + 5).lineTo(550, position + 5).stroke('#e5e7eb');

    const totalAmount = order.amount || order.totalAmount || 0;
    doc.font('Helvetica-Bold');
    doc.text('Grand Total:', 350, position + 20, { width: 80, align: 'right' });
    doc.text(`₹${Number(totalAmount).toLocaleString('en-IN')}`, 450, position + 20, {
      width: 80,
      align: 'right',
    });

    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Thank you for your purchase!', 50, 700, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Invoice download error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "Pending",
      "Order Accepted",
      "Order Placed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status state provided.",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status and push into history array
    order.orderStatus = orderStatus;
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: orderStatus,
      updatedAt: new Date(),
    });

    await order.save();

    // Socket alert to notify customer live
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${order.user}`).emit("order_status_updated", {
        orderId: order._id,
        orderStatus,
        message: `Your order #${order._id.toString().slice(-6)} is now ${orderStatus}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${orderStatus}"`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};