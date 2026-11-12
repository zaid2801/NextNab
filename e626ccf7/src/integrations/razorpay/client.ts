type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string } | undefined;
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export type RazorpayResult = {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export type OpenCheckoutInput = {
  keyId: string;
  razorpayOrderId: string;
  amountInr: number;
  prefill?: { name?: string; email?: string; contact?: string } | undefined;
};

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

/** Opens the Razorpay checkout modal and resolves with the signed response. */
export async function openRazorpayCheckout(input: OpenCheckoutInput): Promise<RazorpayResult> {
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay checkout failed to initialise");

  return new Promise<RazorpayResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: input.keyId,
      order_id: input.razorpayOrderId,
      amount: Math.round(input.amountInr * 100),
      currency: "INR",
      name: "NextNab",
      description: "Order payment",
      prefill: input.prefill,
      theme: { color: "#5300b7" },
      handler: (response) =>
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        }),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    checkout.open();
  });
}
