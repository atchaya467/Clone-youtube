import Razorpay from "razorpay";
import crypto from "crypto";
import users from "../Modals/Auth.js";

// Initialize Razorpay with env variables or fallback test placeholders
const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholderID";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholderSecret12345";

const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

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
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const isMockOrder = razorpay_order_id && razorpay_order_id.startsWith("order_mock_");
    const isTestPlaceholder = key_id === "rzp_test_placeholderID";

    let isVerified = false;

    if (isMockOrder || isTestPlaceholder) {
      // Automatic verify for test mock payments
      isVerified = true;
    } else {
      // Validate payment signature using crypto
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      isVerified = generatedSignature === razorpay_signature;
    }

    if (isVerified) {
      // Upgrade user's premium status in database
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { $set: { isPremium: true } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully! You are now a Premium user.",
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
