import { Link } from "@tanstack/react-router";
import { Briefcase, ShoppingBasket } from "lucide-react";
import { useProductCategories, useServiceCategories } from "@/hooks/useCatalog";
import { categoryIcon } from "@/lib/icons";
import { container } from "@/lib/design-system";
import { Skeleton } from "@/components/ui/skeleton";

type CatalogTo = "/groceries" | "/home-services";

export function CategoryRail({ mode }: { mode: "grocery" | "services" }) {
  const productCats = useProductCategories();
  const serviceCats = useServiceCategories();
  const cats = mode === "grocery" ? productCats : serviceCats;

  return (
    <section className={`${container} pt-8`} aria-labelledby="categories-heading">
      <div className="flex items-center justify-between">
        <h2 id="categories-heading" className="font-display text-xl font-extrabold sm:text-2xl">
          Categories
        </h2>
        <Link
          to={mode === "grocery" ? "/groceries" : "/home-services"}
          className="text-sm font-bold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {cats.isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-20 shrink-0 rounded-2xl" />
          ))
        ) : (
          <>
            {mode === "grocery" ? (
              <CategoryTile
                label="Services"
                icon={<Briefcase className="size-6" aria-hidden="true" />}
                to="/home-services"
                active
              />
            ) : (
              <CategoryTile
                label="Groceries"
                icon={<ShoppingBasket className="size-6" aria-hidden="true" />}
                to="/groceries"
                active
              />
            )}
            {(cats.data ?? []).map((cat) => {
              const Icon = categoryIcon(cat.icon, ShoppingBasket);
              return (
                <CategoryTile
                  key={cat.id}
                  label={cat.name}
                  icon={<Icon className="size-6" aria-hidden="true" />}
                  to={mode === "grocery" ? "/groceries" : "/home-services"}
                  category={cat.slug}
                />
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}

function CategoryTile({
  label,
  icon,
  to,
  category,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  to: CatalogTo;
  category?: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      search={category ? { category } : {}}
      className="flex w-20 shrink-0 flex-col items-center gap-2"
    >
      <span
        className={
          active
            ? "grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand"
            : "grid size-16 place-items-center rounded-2xl bg-accent text-primary transition-colors hover:bg-brand-light"
        }
      >
        {icon}
      </span>
      <span
        className={
          active
            ? "text-center text-xs font-bold text-primary"
            : "text-center text-xs font-semibold text-muted-foreground"
        }
      >
        {label}
      </span>
    </Link>
  );
}
