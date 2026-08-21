import nodemailer from "nodemailer";

export const verifyEmail = async (token, email) => {
  console.log("========== VERIFY EMAIL ==========");
  console.log("token:", token);
  console.log("email:", email);

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

  const mailConfigurations = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Hi!

Please verify your email by clicking the link below:

http://localhost:5173/verify/${token}

Thanks`,
  };

  console.log("mailConfigurations:", mailConfigurations);

  try {
    const info = await transporter.sendMail(mailConfigurations);
    console.log("Email Sent Successfully");
    console.log(info.response);
  } catch (error) {
    console.error("Email Error:", error);
  }
};