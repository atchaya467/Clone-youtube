import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import users from "../Modals/Auth.js";

// Initialize Razorpay with env variables or fallback test placeholders
const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholderID";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholderSecret12345";

const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

const sendInvoiceEmail = async (userEmail, userName, planName, amount, paymentId) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "YourTube <no-reply@yourtube.com>";

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #EA580C; border-bottom: 2px solid #EA580C; padding-bottom: 10px;">YourTube - Plan Upgrade Invoice</h2>
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Thank you for upgrading! Your transaction was completed successfully, and your account has been upgraded.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f9f9f9;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Invoice Item</th>
          <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Details</th>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Upgraded Plan</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd;"><strong>${planName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Price Paid</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${amount} INR</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Transaction ID</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd; font-family: monospace;">${paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Date</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">Enjoy your upgraded video viewing limits and downloads!</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 20px;" />
      <p style="font-size: 11px; color: #888; text-align: center;">This is an automated invoice. Do not reply to this email.</p>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: Number(port) === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: userEmail,
        subject: `YourTube Invoice: Upgrade to ${planName} Plan`,
        html: emailBody,
      });
      console.log(`Invoice email sent successfully to ${userEmail} via SMTP.`);
    } catch (e) {
      console.error("Failed to send email via SMTP, logging to console:", e.message);
      logMockInvoice(userEmail, emailBody);
    }
  } else {
    console.log("SMTP environment variables not configured. Logging invoice details to console (Mock Mode).");
    logMockInvoice(userEmail, emailBody);
  }
};

const logMockInvoice = (userEmail, htmlBody) => {
  console.log("================ MOCK INVOICE EMAIL START ================");
  console.log(`TO: ${userEmail}`);
  console.log(`SUBJECT: YourTube Invoice: Upgrade Completed`);
  console.log("CONTENT:");
  console.log(htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  console.log("================= MOCK INVOICE EMAIL END =================");
};

export const createOrder = async (req, res) => {
  const { amount = 199 } = req.body; // Default ₹199 INR

  const options = {
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    // If using placeholder keys, mock the order creation to avoid errors
    if (key_id === "rzp_test_placeholderID") {
      return res.status(200).json({
        id: `order_mock_${Date.now()}`,
        entity: "order",
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        status: "created",
        isMock: true,
      });
    }

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ message: "Could not create payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, plan = "Premium", amount = 199 } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const isMockOrder = razorpay_order_id && razorpay_order_id.startsWith("order_mock_");
    const isTestPlaceholder = key_id === "rzp_test_placeholderID";

    let isVerified = false;

    if (isMockOrder || isTestPlaceholder) {
      isVerified = true;
    } else {
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      isVerified = generatedSignature === razorpay_signature;
    }

    if (isVerified) {
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { $set: { isPremium: true, plan: plan } },
        { new: true }
      );

      if (updatedUser) {
        sendInvoiceEmail(
          updatedUser.email, 
          updatedUser.name || "User", 
          plan, 
          amount, 
          razorpay_payment_id || `pay_mock_${Date.now()}`
        ).catch(err => {
          console.error("Async email delivery failed:", err.message);
        });
      }

      return res.status(200).json({
        success: true,
        message: `Payment verified successfully! You have been upgraded to the ${plan} plan.`,
        user: updatedUser,
      });
    } else {
      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }
  } catch (error) {
    console.error("Error in payment verification:", error);
    return res.status(500).json({ message: "Something went wrong during verification" });
  }
};
