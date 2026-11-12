import type { Tables, Enums } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Address = Tables<"addresses">;
export type LocationRow = Tables<"locations">;
export type Store = Tables<"stores">;
export type StoreCategory = Tables<"store_categories">;
export type Product = Tables<"products">;
export type ProductCategory = Tables<"product_categories">;
export type CartItem = Tables<"cart_items">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Payment = Tables<"payments">;
export type ServiceCategory = Tables<"service_categories">;
export type ServiceProvider = Tables<"service_providers">;
export type Service = Tables<"services">;
export type ServiceBooking = Tables<"service_bookings">;
export type Rider = Tables<"riders">;
export type DeliveryAssignment = Tables<"delivery_assignments">;
export type PartnerApplication = Tables<"partner_applications">;
export type Review = Tables<"reviews">;

export type AppRole = Enums<"app_role">;
export type OrderStatus = Enums<"order_status">;
export type PaymentMethod = Enums<"payment_method">;
export type PaymentStatus = Enums<"payment_status">;
export type BookingStatus = Enums<"booking_status">;
export type PartnerType = Enums<"partner_type">;
export type ApplicationStatus = Enums<"application_status">;

export type CartLine = CartItem & { product: Product | null };
export type ProviderWithCategory = ServiceProvider & { category: ServiceCategory | null };
export type ProviderDetail = ProviderWithCategory & {
  services: Service[];
  reviews: Review[];
};
export type OrderWithItems = Order & { order_items: OrderItem[]; payments: Payment[] };
export type StoreWithCategory = Store & { category: StoreCategory | null };
export type ServiceWithProvider = Service & {
  provider: Pick<ServiceProvider, "full_name" | "slug"> | null;
};
export type WishlistEntry = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: Product | null;
};
export type PlacedOrder = {
  id: string;
  order_number: string;
  store_id: string | null;
  total: number;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type Payout = {
  id: string;
  partner_type: PartnerType;
  partner_id: string;
  user_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: "pending" | "paid";
  note: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
};
