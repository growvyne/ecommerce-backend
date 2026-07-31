import nodemailer from "nodemailer";

export const verifyEmail = async (token, email) => {
  console.log("========== VERIFY EMAIL ==========");
  
  if (!email) {
    console.log("ERROR: Email is missing!");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // Use the environment variable if it exists, otherwise fall back to network IP for testing
  const frontendUrl = process.env.FRONTEND_URL || "http://192.168.1.6:5173";

  const mailConfigurations = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Hi!

Please verify your email by clicking the link below:

${frontendUrl}/verify/${token}

Thanks`,
  };

  try {
    const info = await transporter.sendMail(mailConfigurations);
    console.log("Email Sent Successfully");
    console.log(info.response);
  } catch (error) {
    console.error("Email Error:", error);
  }
};