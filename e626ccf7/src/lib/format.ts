export function inr(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function discountPercent(mrp: number | string, price: number | string): number {
  const m = Number(mrp);
  const p = Number(price);
  if (!m || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function newOrderNumber(): string {
  return `NN-${Math.floor(10000 + Math.random() * 89999)}`;
}

export function newBookingNumber(): string {
  return `NB-${Math.floor(10000 + Math.random() * 89999)}`;
}

export function dayKey(value: string | number | Date): string {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function last7Days(): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
    });
  }
  return days;
}
