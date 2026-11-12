import type { CashfreeMode } from "@/integrations/cashfree/server";

type CashfreeInstance = {
  checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => void;
};

type CashfreeFactory = (options: { mode: CashfreeMode }) => CashfreeInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

export type OpenCashfreeInput = {
  paymentSessionId: string;
  mode: CashfreeMode;
};

const SDK_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Cashfree checkout"));
    document.body.appendChild(script);
  });
}

/**
 * Launches the Cashfree Drop-in. It navigates the tab to Cashfree and then back
 * to the return URL, so this promise never settles on a successful payment —
 * callers must stash everything needed to finish the order before invoking it.
 */
export async function openCashfreeCheckout(input: OpenCashfreeInput): Promise<void> {
  await loadScript();
  const Cashfree = window.Cashfree;
  if (!Cashfree) throw new Error("Cashfree checkout failed to initialise");

  Cashfree({ mode: input.mode }).checkout({
    paymentSessionId: input.paymentSessionId,
    redirectTarget: "_self",
  });
}
