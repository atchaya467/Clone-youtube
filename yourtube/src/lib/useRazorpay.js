import axiosInstance from "./axiosinstance";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useRazorpayUpgrade = (user, upgradeUserLocally) => {
  const triggerUpgrade = async () => {
    if (!user) {
      alert("Please sign in to upgrade to Premium.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    try {
      // 1. Create order on backend
      const orderRes = await axiosInstance.post("/payment/order", {
        amount: 199, // ₹199 INR
      });

      const order = orderRes.data;

      // 2. Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholderID",
        amount: order.amount,
        currency: order.currency,
        name: "YourTube Premium",
        description: "Unlimited video downloads & Premium Access",
        image: user.image || "https://github.com/shadcn.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature || "",
              userId: user._id,
            });

            if (verifyRes.data.success) {
              upgradeUserLocally();
              alert("Congratulations! Your payment was verified and you have been upgraded to Premium.");
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment. If amount was debited, it will be refunded.");
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#EA580C", // Orange-600
        },
      };

      const isPlaceholderKey = options.key === "rzp_test_placeholderID";

      if (isPlaceholderKey) {
        const confirmMock = window.confirm(
          "[Test Mode] No Razorpay API Keys are configured. Would you like to simulate a successful payment of ₹199 to test the premium upgrade?"
        );
        if (confirmMock) {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_order_id: order.id,
              razorpay_signature: "mock_signature",
              userId: user._id,
            });

            if (verifyRes.data.success) {
              upgradeUserLocally();
              alert("Congratulations! Your simulated payment was verified and you have been upgraded to Premium.");
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment.");
          }
        }
        return;
      }

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Error initiating payment:", error);
      alert("Could not start payment. Please try again later.");
    }
  };

  return { triggerUpgrade };
};
