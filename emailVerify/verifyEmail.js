import nodemailer from "nodemailer";

export const verifyEmail = async (token, email) => {
  console.log("========== START VERIFY EMAIL ROUTE ==========");
  console.log("Target Email:", email);
  console.log("Using MAIL_USER:", process.env.MAIL_USER);
  
  if (!email) {
    console.log("ERROR: Target email parameter is completely missing!");
    return;
  }

  // Explicit cloud-optimized connection mapping
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    debug: true,   // 👈 Enables detailed protocol logging
    logger: true,  // 👈 Prints SMTP traffic directly to Render console
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://192.168.1.6:5173";

  const mailConfigurations = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Hi!\n\nPlease verify your email by clicking the link below:\n\n${frontendUrl}/verify/${token}\n\nThanks`,
  };

  try {
    console.log("Attempting to send email via SMTP...");
    const info = await transporter.sendMail(mailConfigurations);
    console.log("✅ Email Sent Successfully!");
    console.log("SMTP Response Info:", info.response);
  } catch (error) {
    console.error("❌ CRITICAL EMAIL ERROR RECORDED:");
    console.error(error.message);
    console.error(error.stack);
  }
  console.log("========== END VERIFY EMAIL ROUTE ==========");
};