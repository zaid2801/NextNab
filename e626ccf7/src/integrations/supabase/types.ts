export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          contact_name: string;
          contact_phone: string;
          created_at: string;
          id: string;
          is_default: boolean;
          label: string;
          line1: string;
          line2: string | null;
          pincode: string;
          state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city?: string;
          contact_name: string;
          contact_phone: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          line1: string;
          line2?: string | null;
          pincode?: string;
          state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          contact_name?: string;
          contact_phone?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          line1?: string;
          line2?: string | null;
          pincode?: string;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      delivery_assignments: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          delivered_at: string | null;
          distance_km: number | null;
          drop_location: string | null;
          earnings: number | null;
          id: string;
          order_id: string;
          picked_up_at: string | null;
          pickup_location: string | null;
          rider_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          distance_km?: number | null;
          drop_location?: string | null;
          earnings?: number | null;
          id?: string;
          order_id: string;
          picked_up_at?: string | null;
          pickup_location?: string | null;
          rider_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          distance_km?: number | null;
          drop_location?: string | null;
          earnings?: number | null;
          id?: string;
          order_id?: string;
          picked_up_at?: string | null;
          pickup_location?: string | null;
          rider_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_assignments_rider_id_fkey";
            columns: ["rider_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          area: string | null;
          city: string;
          created_at: string;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          state_code: string;
          updated_at: string;
        };
        Insert: {
          area?: string | null;
          city: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          state_code?: string;
          updated_at?: string;
        };
        Update: {
          area?: string | null;
          city?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          state_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_total: number;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit: string | null;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total: number;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit?: string | null;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total?: number;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          unit?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          address_id: string | null;
          assigned_at: string | null;
          cod_fee: number;
          confirmed_at: string | null;
          created_at: string;
          delivered_at: string | null;
          delivery_address: string | null;
          delivery_fee: number;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          discount: number;
          eta_minutes: number;
          id: string;
          order_number: string;
          out_for_delivery_at: string | null;
          placed_at: string;
          status: Database["public"]["Enums"]["order_status"];
          store_id: string | null;
          subtotal: number;
          taxes: number;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_id?: string | null;
          assigned_at?: string | null;
          cod_fee?: number;
          confirmed_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          discount?: number;
          eta_minutes?: number;
          id?: string;
          order_number: string;
          out_for_delivery_at?: string | null;
          placed_at?: string;
          status?: Database["public"]["Enums"]["order_status"];
          store_id?: string | null;
          subtotal?: number;
          taxes?: number;
          total?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_id?: string | null;
          assigned_at?: string | null;
          cod_fee?: number;
          confirmed_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          discount?: number;
          eta_minutes?: number;
          id?: string;
          order_number?: string;
          out_for_delivery_at?: string | null;
          placed_at?: string;
          status?: Database["public"]["Enums"]["order_status"];
          store_id?: string | null;
          subtotal?: number;
          taxes?: number;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          paid_at: string | null;
          partner_id: string;
          partner_type: Database["public"]["Enums"]["partner_type"];
          period_end: string;
          period_start: string;
          status: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          paid_at?: string | null;
          partner_id: string;
          partner_type: Database["public"]["Enums"]["partner_type"];
          period_end: string;
          period_start: string;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          paid_at?: string | null;
          partner_id?: string;
          partner_type?: Database["public"]["Enums"]["partner_type"];
          period_end?: string;
          period_start?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      email_otps: {
        Row: {
          attempts: number;
          code_hash: string;
          consumed_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          purpose: string;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          consumed_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          purpose: string;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          consumed_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          purpose?: string;
        };
        Relationships: [];
      };
      partner_applications: {
        Row: {
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          base_visit_fee: number | null;
          business_address: string | null;
          business_category: string | null;
          business_name: string | null;
          business_proof_url: string | null;
          certificate_url: string | null;
          city: string;
          created_at: string;
          current_step: number;
          experience: string | null;
          full_name: string;
          gstin: string | null;
          hourly_rate: number | null;
          id: string;
          id_back_url: string | null;
          id_front_url: string | null;
          id_number: string | null;
          id_type: string | null;
          license_number: string | null;
          partner_type: Database["public"]["Enums"]["partner_type"];
          phone: string;
          referral_code: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          service_areas: string[] | null;
          service_category: string | null;
          skills: string | null;
          status: Database["public"]["Enums"]["application_status"];
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          vehicle_number: string | null;
          vehicle_type: string | null;
        };
        Insert: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_ifsc?: string | null;
          base_visit_fee?: number | null;
          business_address?: string | null;
          business_category?: string | null;
          business_name?: string | null;
          business_proof_url?: string | null;
          certificate_url?: string | null;
          city?: string;
          created_at?: string;
          current_step?: number;
          experience?: string | null;
          full_name: string;
          gstin?: string | null;
          hourly_rate?: number | null;
          id?: string;
          id_back_url?: string | null;
          id_front_url?: string | null;
          id_number?: string | null;
          id_type?: string | null;
          license_number?: string | null;
          partner_type: Database["public"]["Enums"]["partner_type"];
          phone: string;
          referral_code?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_areas?: string[] | null;
          service_category?: string | null;
          skills?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          vehicle_number?: string | null;
          vehicle_type?: string | null;
        };
        Update: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_ifsc?: string | null;
          base_visit_fee?: number | null;
          business_address?: string | null;
          business_category?: string | null;
          business_name?: string | null;
          business_proof_url?: string | null;
          certificate_url?: string | null;
          city?: string;
          created_at?: string;
          current_step?: number;
          experience?: string | null;
          full_name?: string;
          gstin?: string | null;
          hourly_rate?: number | null;
          id?: string;
          id_back_url?: string | null;
          id_front_url?: string | null;
          id_number?: string | null;
          id_type?: string | null;
          license_number?: string | null;
          partner_type?: Database["public"]["Enums"]["partner_type"];
          phone?: string;
          referral_code?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_areas?: string[] | null;
          service_category?: string | null;
          skills?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          vehicle_number?: string | null;
          vehicle_type?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          booking_id: string | null;
          created_at: string;
          id: string;
          is_test: boolean;
          method: Database["public"]["Enums"]["payment_method"];
          order_id: string | null;
          reference: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
          upi_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          is_test?: boolean;
          method?: Database["public"]["Enums"]["payment_method"];
          order_id?: string | null;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          upi_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          is_test?: boolean;
          method?: Database["public"]["Enums"]["payment_method"];
          order_id?: string | null;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          upi_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          fssai_license: string | null;
          id: string;
          image_url: string | null;
          is_live: boolean;
          mrp: number;
          name: string;
          price: number;
          shelf_life: string | null;
          short_description: string | null;
          sku: string | null;
          slug: string;
          stock: number;
          storage_info: string | null;
          store_id: string | null;
          unit: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          fssai_license?: string | null;
          id?: string;
          image_url?: string | null;
          is_live?: boolean;
          mrp: number;
          name: string;
          price: number;
          shelf_life?: string | null;
          short_description?: string | null;
          sku?: string | null;
          slug: string;
          stock?: number;
          storage_info?: string | null;
          store_id?: string | null;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          fssai_license?: string | null;
          id?: string;
          image_url?: string | null;
          is_live?: boolean;
          mrp?: number;
          name?: string;
          price?: number;
          shelf_life?: string | null;
          short_description?: string | null;
          sku?: string | null;
          slug?: string;
          stock?: number;
          storage_info?: string | null;
          store_id?: string | null;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_area: string | null;
          author_name: string;
          comment: string | null;
          created_at: string;
          id: string;
          is_featured: boolean;
          order_id: string | null;
          provider_id: string | null;
          rating: number;
          store_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          author_area?: string | null;
          author_name: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          order_id?: string | null;
          provider_id?: string | null;
          rating: number;
          store_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          author_area?: string | null;
          author_name?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          order_id?: string | null;
          provider_id?: string | null;
          rating?: number;
          store_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "service_providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      riders: {
        Row: {
          created_at: string;
          full_name: string;
          hub: string;
          id: string;
          is_online: boolean;
          is_verified: boolean;
          license_number: string | null;
          phone: string | null;
          rating: number;
          rider_code: string;
          updated_at: string;
          user_id: string;
          vehicle_number: string | null;
          vehicle_type: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          hub?: string;
          id?: string;
          is_online?: boolean;
          is_verified?: boolean;
          license_number?: string | null;
          phone?: string | null;
          rating?: number;
          rider_code: string;
          updated_at?: string;
          user_id: string;
          vehicle_number?: string | null;
          vehicle_type?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          hub?: string;
          id?: string;
          is_online?: boolean;
          is_verified?: boolean;
          license_number?: string | null;
          phone?: string | null;
          rating?: number;
          rider_code?: string;
          updated_at?: string;
          user_id?: string;
          vehicle_number?: string | null;
          vehicle_type?: string;
        };
        Relationships: [];
      };
      service_bookings: {
        Row: {
          address_id: string | null;
          amount: number;
          booking_number: string;
          created_at: string;
          id: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          provider_id: string;
          scheduled_date: string;
          service_address: string | null;
          service_id: string | null;
          service_name: string;
          status: Database["public"]["Enums"]["booking_status"];
          time_slot: string;
          updated_at: string;
          user_id: string;
          visiting_fee: number;
        };
        Insert: {
          address_id?: string | null;
          amount: number;
          booking_number: string;
          created_at?: string;
          id?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          provider_id: string;
          scheduled_date: string;
          service_address?: string | null;
          service_id?: string | null;
          service_name: string;
          status?: Database["public"]["Enums"]["booking_status"];
          time_slot: string;
          updated_at?: string;
          user_id: string;
          visiting_fee?: number;
        };
        Update: {
          address_id?: string | null;
          amount?: number;
          booking_number?: string;
          created_at?: string;
          id?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          provider_id?: string;
          scheduled_date?: string;
          service_address?: string | null;
          service_id?: string | null;
          service_name?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          time_slot?: string;
          updated_at?: string;
          user_id?: string;
          visiting_fee?: number;
        };
        Relationships: [
          {
            foreignKeyName: "service_bookings_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_bookings_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "service_providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      service_providers: {
        Row: {
          available_days: string[];
          avatar_url: string | null;
          base_visit_fee: number | null;
          bio: string | null;
          category_id: string | null;
          city: string;
          created_at: string;
          experience_years: number;
          full_name: string;
          headline: string | null;
          hourly_rate: number | null;
          id: string;
          is_online: boolean;
          is_verified: boolean;
          jobs_done: number;
          rating: number;
          service_areas: string[];
          slug: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          available_days?: string[];
          avatar_url?: string | null;
          base_visit_fee?: number | null;
          bio?: string | null;
          category_id?: string | null;
          city?: string;
          created_at?: string;
          experience_years?: number;
          full_name: string;
          headline?: string | null;
          hourly_rate?: number | null;
          id?: string;
          is_online?: boolean;
          is_verified?: boolean;
          jobs_done?: number;
          rating?: number;
          service_areas?: string[];
          slug: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          available_days?: string[];
          avatar_url?: string | null;
          base_visit_fee?: number | null;
          bio?: string | null;
          category_id?: string | null;
          city?: string;
          created_at?: string;
          experience_years?: number;
          full_name?: string;
          headline?: string | null;
          hourly_rate?: number | null;
          id?: string;
          is_online?: boolean;
          is_verified?: boolean;
          jobs_done?: number;
          rating?: number;
          service_areas?: string[];
          slug?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_providers_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          duration: string | null;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          provider_id: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
          provider_id: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          provider_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "service_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      store_categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          address: string | null;
          area_id: string | null;
          category_id: string | null;
          city: string;
          closing_time: string | null;
          created_at: string;
          gstin: string | null;
          id: string;
          image_url: string | null;
          is_live: boolean;
          is_online: boolean;
          latitude: number | null;
          longitude: number | null;
          min_order_value: number | null;
          name: string;
          open_days: string[];
          opening_time: string | null;
          owner_id: string | null;
          owner_name: string | null;
          packaging_charge: number | null;
          rating: number | null;
          slug: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          area_id?: string | null;
          category_id?: string | null;
          city?: string;
          closing_time?: string | null;
          created_at?: string;
          gstin?: string | null;
          id?: string;
          image_url?: string | null;
          is_live?: boolean;
          is_online?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          min_order_value?: number | null;
          name: string;
          open_days?: string[];
          opening_time?: string | null;
          owner_id?: string | null;
          owner_name?: string | null;
          packaging_charge?: number | null;
          rating?: number | null;
          slug?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          area_id?: string | null;
          category_id?: string | null;
          city?: string;
          closing_time?: string | null;
          created_at?: string;
          gstin?: string | null;
          id?: string;
          image_url?: string | null;
          is_live?: boolean;
          is_online?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          min_order_value?: number | null;
          name?: string;
          open_days?: string[];
          opening_time?: string | null;
          owner_id?: string | null;
          owner_name?: string | null;
          packaging_charge?: number | null;
          rating?: number | null;
          slug?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "store_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stores_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_order_status: {
        Args: {
          p_order_id: string;
          p_status: Database["public"]["Enums"]["order_status"];
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_set_payment_status: {
        Args: {
          p_payment_id: string;
          p_status: Database["public"]["Enums"]["payment_status"];
          p_reference?: string | null;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
        SetofOptions: {
          from: "*";
          to: "payments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_set_partner_flag: {
        Args: {
          p_table: string;
          p_id: string;
          p_flag: string;
          p_value: boolean;
        };
        Returns: boolean;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: Database["public"]["Tables"]["service_bookings"]["Row"];
        SetofOptions: {
          from: "*";
          to: "service_bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cancel_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      notify_user: {
        Args: {
          _user_id: string;
          _title: string;
          _body?: string | null;
          _link?: string | null;
        };
        Returns: Database["public"]["Tables"]["notifications"]["Row"];
        SetofOptions: {
          from: "*";
          to: "notifications";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      assign_order_rider: {
        Args: { _order_id: string };
        Returns: {
          accepted_at: string | null;
          created_at: string;
          delivered_at: string | null;
          distance_km: number | null;
          drop_location: string | null;
          earnings: number | null;
          id: string;
          order_id: string;
          picked_up_at: string | null;
          pickup_location: string | null;
          rider_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "delivery_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_assignment_rider: {
        Args: { _rider_id: string; _user_id: string };
        Returns: boolean;
      };
      is_order_rider: {
        Args: { _order_id: string; _user_id: string };
        Returns: boolean;
      };
      is_order_store_owner: {
        Args: { _order_id: string; _user_id: string };
        Returns: boolean;
      };
      owns_order: {
        Args: { _order_id: string; _user_id: string };
        Returns: boolean;
      };
      owns_store: {
        Args: { _store_id: string; _user_id: string };
        Returns: boolean;
      };
      place_order: {
        Args: {
          _address_id: string;
          _delivery_address: string;
          _method: Database["public"]["Enums"]["payment_method"];
          _upi_id?: string | null;
          _cod_fee?: number;
          _items?: Json;
          _delivery_lat?: number | null;
          _delivery_lng?: number | null;
        };
        Returns: Json;
      };
      review_partner_application: {
        Args: {
          _app_id: string;
          _decision: Database["public"]["Enums"]["application_status"];
          _note?: string;
        };
        Returns: {
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          base_visit_fee: number | null;
          business_address: string | null;
          business_category: string | null;
          business_name: string | null;
          business_proof_url: string | null;
          certificate_url: string | null;
          city: string;
          created_at: string;
          current_step: number;
          experience: string | null;
          full_name: string;
          gstin: string | null;
          hourly_rate: number | null;
          id: string;
          id_back_url: string | null;
          id_front_url: string | null;
          id_number: string | null;
          id_type: string | null;
          license_number: string | null;
          partner_type: Database["public"]["Enums"]["partner_type"];
          phone: string;
          referral_code: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          service_areas: string[] | null;
          service_category: string | null;
          skills: string | null;
          status: Database["public"]["Enums"]["application_status"];
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          vehicle_number: string | null;
          vehicle_type: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "partner_applications";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      rider_update_delivery: {
        Args: { _action: string; _assignment_id: string };
        Returns: {
          accepted_at: string | null;
          created_at: string;
          delivered_at: string | null;
          distance_km: number | null;
          drop_location: string | null;
          earnings: number | null;
          id: string;
          order_id: string;
          picked_up_at: string | null;
          pickup_location: string | null;
          rider_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "delivery_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      app_role: "customer" | "shopkeeper" | "service_provider" | "rider" | "admin";
      application_status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
      booking_status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
      order_status:
        | "placed"
        | "merchant_confirmed"
        | "partner_assigned"
        | "out_for_delivery"
        | "delivered"
        | "cancelled";
      partner_type: "shopkeeper" | "service_provider" | "rider";
      payment_method: "upi" | "card" | "cod";
      payment_status: "pending" | "processing" | "success" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "shopkeeper", "service_provider", "rider", "admin"],
      application_status: ["draft", "submitted", "under_review", "approved", "rejected"],
      booking_status: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      order_status: [
        "placed",
        "merchant_confirmed",
        "partner_assigned",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      partner_type: ["shopkeeper", "service_provider", "rider"],
      payment_method: ["upi", "card", "cod"],
      payment_status: ["pending", "processing", "success", "failed"],
    },
  },
} as const;
