import nodemailer from "nodemailer";

export const sendOtpEmail = async (otp, email) => {
//   console.log("========== VERIFY EMAIL ==========");
//   console.log("token:", token);
//   console.log("email:", email);

//   if (!email) {
//     console.log("ERROR: Email is missing!");
//     return;
//   }
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
    subject: "Password Reset OTP",
   html:`<p>Hi!</p>
<p>Your OTP for reset your password is:<b>${otp}</b></p>
<p>This OTP is valid for 10 minutes.</p>
<p>Thanks</p>`,
  };

  console.log("mailConfigurations:", mailConfigurations);

  try {
    const info = await transporter.sendMail(mailConfigurations);
    console.log("OTP Sent Successfully");
    console.log(info.response);
  } catch (error) {
    console.error("Email Error:", error);
  }
};