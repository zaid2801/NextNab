export const BUSINESS_CATEGORIES = [
  "Grocery Store",
  "Medical Store",
  "Electronics",
  "Clothing & Fashion",
  "Restaurant / Food",
  "Bakery & Sweets",
  "Stationery & Books",
  "Hardware & Tools",
  "Beauty & Salon",
  "Dairy & Milk",
  "Fruits & Vegetables",
  "Mobile & Accessories",
  "Home Services",
  "Other",
] as const;

export const SERVICE_ROLES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mechanic",
  "AC Repair",
  "Appliance Repair",
  "Cleaning",
  "Pest Control",
  "Welder",
  "Mason / Construction",
  "Other",
] as const;

export const VEHICLE_TYPES = ["Scooter", "Bike", "Electric"] as const;

export const TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM",
  "05:00 PM - 07:00 PM",
  "07:00 PM - 09:00 PM",
] as const;

export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidPhone(value: string) {
  return PHONE_RE.test(value.trim());
}

export function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}
