import createGmailSend from "gmail-send";

export const verifyEmail = async (token, email) => {
  console.log("========== START VERIFY EMAIL ROUTE ==========");
  console.log("Target Email:", email);
  
  if (!email) {
    console.log("ERROR: Target email parameter is completely missing!");
    return;
  }

  // Uses HTTPS API calls under the hood to bypass Render's firewall entirely
  const send = createGmailSend({
    user: process.env.MAIL_USER, // Your Gmail address
    pass: process.env.MAIL_PASS, // Your 16-character Google App Password
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://192.168.1.6:5173";

  try {
    console.log("Sending verification email via Google API...");
    
    const res = await send({
      to: email,
      subject: "Email Verification",
      text: `Hi!\n\nPlease verify your email by clicking the link below:\n\n${frontendUrl}/verify/${token}\n\nThanks`,
    });

    console.log("✅ Email Sent Successfully!");
    console.log(res);
  } catch (error) {
    console.error("❌ CRITICAL EMAIL ERROR RECORDED:");
    console.error(error.message || error);
  }
  
  console.log("========== END VERIFY EMAIL ROUTE ==========");
};