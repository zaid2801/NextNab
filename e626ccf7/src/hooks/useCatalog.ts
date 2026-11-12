import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Product,
  ProductCategory,
  ProviderWithCategory,
  ServiceCategory,
  ServiceWithProvider,
  StoreWithCategory,
} from "@/types";

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async (): Promise<ProductCategory[]> => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProducts(categorySlug?: string, search?: string) {
  return useQuery({
    queryKey: ["products", categorySlug ?? "all", search ?? ""],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase.from("products").select("*").eq("is_live", true).order("name");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      let rows = data ?? [];
      if (categorySlug && categorySlug !== "all") {
        const { data: cat } = await supabase
          .from("product_categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        rows = cat ? rows.filter((row) => row.category_id === cat.id) : [];
      }
      return rows;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: ["service-categories"],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProviders(categorySlug?: string) {
  return useQuery({
    queryKey: ["providers", categorySlug ?? "all"],
    queryFn: async (): Promise<ProviderWithCategory[]> => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*, category:service_categories(*)")
        .order("rating", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ProviderWithCategory[];
      if (!categorySlug || categorySlug === "all") return rows;
      return rows.filter((row) => row.category?.slug === categorySlug);
    },
  });
}

export function useProvider(slug: string) {
  return useQuery({
    queryKey: ["provider", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*, category:service_categories(*), services(*), reviews(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async (): Promise<StoreWithCategory[]> => {
      const { data, error } = await supabase
        .from("stores")
        .select("*, category:store_categories(*)")
        .eq("is_live", true)
        .order("rating", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StoreWithCategory[];
    },
  });
}

export function useStore(slug: string) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async (): Promise<StoreWithCategory | null> => {
      const { data, error } = await supabase
        .from("stores")
        .select("*, category:store_categories(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as StoreWithCategory | null) ?? null;
    },
  });
}

export function useStoreProductsLive(storeId: string | undefined, search?: string) {
  return useQuery({
    queryKey: ["store-products-live", storeId, search ?? ""],
    enabled: !!storeId,
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*, category:product_categories(*)")
        .eq("store_id", storeId!)
        .eq("is_live", true)
        .order("name");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useServices(search?: string) {
  return useQuery({
    queryKey: ["services", search ?? ""],
    queryFn: async (): Promise<ServiceWithProvider[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*, provider:service_providers(full_name, slug)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      let rows = (data ?? []) as ServiceWithProvider[];
      if (search) {
        const term = search.toLowerCase();
        rows = rows.filter(
          (row) =>
            row.name.toLowerCase().includes(term) ||
            (row.provider?.full_name ?? "").toLowerCase().includes(term),
        );
      }
      return rows;
    },
  });
}
