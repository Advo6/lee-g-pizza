import { prisma } from "@/lib/prisma";
import MenuPage from "@/components/MenuPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, toppings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.topping.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return <MenuPage products={products} toppings={toppings} />;
}
