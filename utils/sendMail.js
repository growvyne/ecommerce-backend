import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Fixed authenticated sender setup
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Fixed system sender email
    pass: process.env.EMAIL_PASS, // App password
  },
});

export const sendAdminOrderEmail = async ({ orderId, customerName, customerEmail, amount, status }) => {
  try {
    // 1. Email sent to ADMIN
    await transporter.sendMail({
      from: `"Store Alert" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // Fixed admin inbox
      subject: `🚨 New Order Alert: #${orderId}`,
      html: `<h2>New Order Received</h2><p>Customer: ${customerName}</p><p>Amount: ₹${amount}</p>`,
    });

    // 2. Email sent to DYNAMIC CUSTOMER
    if (customerEmail) {
      await transporter.sendMail({
        from: `"Your Store Name" <${process.env.EMAIL_USER}>`,
        to: customerEmail, // DYNAMIC customer email
        subject: `Order Confirmation #${orderId}`,
        html: `<h2>Thank you for your order, ${customerName}!</h2><p>Your order total is ₹${amount}.</p>`,
      });
    }

    console.log("✉️ Order emails successfully sent to Admin and Customer");
  } catch (error) {
    console.error("❌ Failed to send order emails:", error.message);
  }
};