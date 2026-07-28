import { PrismaClient, ProductCategory, ToppingCategory } from "@prisma/client";

const prisma = new PrismaClient();

const IMG = {
  beefMayo: "/images/menu/beef-mayo.jpg",
  creamyChicken: "/images/menu/creamy-chicken.jpg",
  justBeef: "/images/menu/just-beef.jpg",
  beefPine: "/images/menu/beef-pine.jpg",
  chickenBbq: "/images/menu/chicken-bbq.jpg",
  chickenMayo: "/images/menu/chicken-mayo.jpg",
  pepperoni: "/images/menu/pepperoni.jpg",
  beefChilli: "/images/menu/beef-chilli.jpg",
  chickenAvo: "/images/menu/chicken-avo.jpg",
  creamyChickenTripleDecker: "/images/menu/creamy-chicken-triple-decker.jpg",
  justBeefTripleDecker: "/images/menu/just-beef-triple-decker.jpg",
  chickenBbqTripleDecker: "/images/menu/chicken-bbq-triple-decker.jpg",
  justChickenTripleDecker: "/images/menu/just-chicken-triple-decker.jpg",
  pepperoniCombo: "/images/menu/pepperoni-combo.jpg",
  ntangoCombo: "/images/menu/ntango-combo.jpg",
  zamzamCombo: "/images/menu/zamzam-combo.jpg",
  thetosCombo: "/images/menu/thetos-combo.jpg",
  nantswoCombo: "/images/menu/nantswo-combo.jpg",
  monateMpolayeCombo: "/images/menu/monate-mpolaye-combo.jpg",
  skeemSaqCombo: "/images/menu/skeemsaq-combo.jpg",
  friendzoneCombo: "/images/menu/friendzone-combo.jpg",
  valentinesCombo: "/images/menu/valentines-combo.jpg",
  chelseaCombo: "/images/menu/chelsea-combo.jpg",
  viallianCombo: "/images/menu/viallian-combo.jpg",
  friesAndPops: "/images/menu/fries-and-pops.jpg",
  friesAndWings: "/images/menu/fries-and-wings.jpg",
  friesPopsAndWings: "/images/menu/fries-pops-and-wings.jpg",
  chickenCheeseBurger: "/images/menu/chicken-cheese-burger.jpg",
  extraLargeFriesAndPops: "/images/menu/extra-large-fries-and-pops.jpg",
  boxOfFries: "/images/menu/box-of-fries.jpg",
} as const;

async function main() {
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();

  const standardPizzas = [
    {
      name: "Beef Mayo",
      description: "Loaded beef mayo pizza with melted cheese on Lee-G's signature base",
      priceMedium: 60,
      priceLarge: 120,
      imageUrl: IMG.beefMayo,
    },
    {
      name: "Creamy Chicken",
      description: "Tender chicken in a rich creamy sauce with melted cheese",
      priceMedium: 50,
      priceLarge: 100,
      imageUrl: IMG.creamyChicken,
    },
    {
      name: "Just Beef",
      description: "Classic beef pizza with Lee-G's sauce and golden cheese",
      priceMedium: 55,
      priceLarge: 110,
      imageUrl: IMG.justBeef,
    },
    {
      name: "Beef Pine",
      description: "Seasoned beef with sweet pineapple on Lee-G's signature base",
      priceMedium: 60,
      priceLarge: 120,
      imageUrl: IMG.beefPine,
    },
    {
      name: "Chicken BBQ",
      description: "Chicken with smoky BBQ sauce and melted cheese",
      priceMedium: 55,
      priceLarge: 110,
      imageUrl: IMG.chickenBbq,
    },
    {
      name: "Chicken Mayo",
      description: "Classic chicken mayo pizza with golden cheese",
      priceMedium: 55,
      priceLarge: 110,
      imageUrl: IMG.chickenMayo,
    },
    {
      name: "Pepperoni",
      description: "Pepperoni pizza with Lee-G's sauce and melted cheese",
      priceMedium: 55,
      priceLarge: 105,
      imageUrl: IMG.pepperoni,
    },
    {
      name: "Beef Chilli",
      description: "Seasoned beef with chilli and melted cheese",
      priceMedium: 60,
      priceLarge: 120,
      imageUrl: IMG.beefChilli,
    },
    {
      name: "Chicken Avo",
      description: "Chicken pizza topped with avocado and creamy flavour",
      priceMedium: 60,
      priceLarge: 120,
      imageUrl: IMG.chickenAvo,
    },
  ];

  for (let i = 0; i < standardPizzas.length; i++) {
    const p = standardPizzas[i];
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        category: ProductCategory.STANDARD,
        imageUrl: p.imageUrl,
        priceMedium: p.priceMedium,
        priceLarge: p.priceLarge,
        sortOrder: i,
      },
    });
  }

  const tripleDeckers = [
    {
      name: "Creamy Chicken Triple Decker",
      priceMedium: 170,
      priceLarge: 195,
      imageUrl: IMG.creamyChickenTripleDecker,
    },
    {
      name: "Just Beef Triple Decker",
      priceMedium: 160,
      priceLarge: 200,
      imageUrl: IMG.justBeefTripleDecker,
    },
    {
      name: "Chicken BBQ Triple Decker",
      priceMedium: 170,
      priceLarge: 195,
      imageUrl: IMG.chickenBbqTripleDecker,
    },
    {
      name: "Just Chicken Triple Decker",
      priceMedium: 170,
      priceLarge: 195,
      imageUrl: IMG.justChickenTripleDecker,
    },
  ];

  for (let i = 0; i < tripleDeckers.length; i++) {
    const p = tripleDeckers[i];
    await prisma.product.create({
      data: {
        name: p.name,
        description: "Three stacked pizza layers loaded with Lee-G's flavour",
        category: ProductCategory.TRIPLE_DECKER,
        imageUrl: p.imageUrl,
        priceMedium: p.priceMedium,
        priceLarge: p.priceLarge,
        sortOrder: 200 + i,
      },
    });
  }

  const combos = [
    {
      name: "Pepperoni Combo",
      description: "Medium pepperoni combo with add-ons",
      priceFixed: 150,
      imageUrl: IMG.pepperoniCombo,
      sortOrder: 300,
    },
    {
      name: "Ntango Combo",
      description: "Medium combo with add-ons",
      priceFixed: 175,
      imageUrl: IMG.ntangoCombo,
      sortOrder: 301,
    },
    {
      name: "Zamzam Combo",
      description: "Large combo served with fries",
      priceFixed: 135,
      imageUrl: IMG.zamzamCombo,
      sortOrder: 302,
    },
    {
      name: "Theto's Combo",
      description: "Medium combo with add-ons",
      priceFixed: 125,
      imageUrl: IMG.thetosCombo,
      sortOrder: 303,
    },
    {
      name: "Nantswo Combo",
      description: "Medium combo with add-ons",
      priceFixed: 120,
      imageUrl: IMG.nantswoCombo,
      sortOrder: 304,
    },
    {
      name: "Monate Mpolaye Combo",
      description: "Medium combo with add-ons",
      priceFixed: 135,
      imageUrl: IMG.monateMpolayeCombo,
      sortOrder: 305,
    },
    {
      name: "SkeemSaq Combo",
      description: "Large combo with add-ons",
      priceFixed: 180,
      imageUrl: IMG.skeemSaqCombo,
      sortOrder: 306,
    },
    {
      name: "FriendZone Combo",
      description: "Two medium pizzas with two boxes of fries",
      priceFixed: 175,
      imageUrl: IMG.friendzoneCombo,
      sortOrder: 307,
    },
    {
      name: "Valentines Combo",
      description: "Medium combo with add-ons",
      priceFixed: 150,
      imageUrl: IMG.valentinesCombo,
      sortOrder: 308,
    },
    {
      name: "Chelsea Combo",
      description: "Medium combo with add-ons",
      priceFixed: 160,
      imageUrl: IMG.chelseaCombo,
      sortOrder: 309,
    },
    {
      name: "Viallian Combo",
      description: "Medium combo with add-ons",
      priceFixed: 165,
      imageUrl: IMG.viallianCombo,
      sortOrder: 310,
    },
  ];

  for (const item of combos) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        category: ProductCategory.COMBO,
        imageUrl: item.imageUrl,
        priceFixed: item.priceFixed,
        sortOrder: item.sortOrder,
      },
    });
  }

  const sides = [
    {
      name: "Fries & Pops",
      description: "Fries served with chicken pops",
      priceFixed: 80,
      imageUrl: IMG.friesAndPops,
      sortOrder: 400,
    },
    {
      name: "Fries & Wings",
      description: "Fries served with wings",
      priceFixed: 85,
      imageUrl: IMG.friesAndWings,
      sortOrder: 401,
    },
    {
      name: "Fries, Pops & Wings",
      description: "Fries served with chicken pops and wings",
      priceFixed: 120,
      imageUrl: IMG.friesPopsAndWings,
      sortOrder: 402,
    },
    {
      name: "Chicken & Cheese Burger",
      description: "Chicken and cheese burger with small fries, 2 pops, and vienna",
      priceFixed: 65,
      imageUrl: IMG.chickenCheeseBurger,
      sortOrder: 403,
    },
    {
      name: "Extra Large Fries & Pops",
      description: "Extra large fries served with 10 chicken pops",
      priceFixed: 115,
      imageUrl: IMG.extraLargeFriesAndPops,
      sortOrder: 404,
    },
    {
      name: "1x Box of Fries",
      description: "One box of Lee-G's fries",
      priceFixed: 50,
      imageUrl: IMG.boxOfFries,
      sortOrder: 405,
    },
  ];

  for (const item of sides) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        category: ProductCategory.SIDE,
        imageUrl: item.imageUrl,
        priceFixed: item.priceFixed,
        sortOrder: item.sortOrder,
      },
    });
  }

  const toppings = [
    {
      name: "Extra Meat",
      category: ToppingCategory.MEATS,
      priceMedium: 15,
      priceLarge: 15,
    },
    {
      name: "Extra Cheese",
      category: ToppingCategory.CHEESES,
      priceMedium: 17,
      priceLarge: 17,
    },
  ];

  for (let i = 0; i < toppings.length; i++) {
    const t = toppings[i];
    await prisma.topping.create({
      data: { ...t, sortOrder: i },
    });
  }

  console.log("✅ Lee-G's Pizza menu seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
