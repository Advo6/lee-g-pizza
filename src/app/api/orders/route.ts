import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { sendOrderConfirmationEmail } from "@/lib/order-emails";
import {
  CRUST_SURCHARGE,
  generateOrderNumber,
  getProductPrice,
  getToppingPrice,
  isValidEmail,
  isValidSouthAfricanPhone,
  normalizePizzaSize,
  normalizeSouthAfricanPhone,
  type CartItem,
  type CrustType,
  STORE_INFO,
} from "@/lib/utils";

import { isAdminRequest } from "@/lib/auth";
import { type PaymentMethod } from "@/lib/payments";
import { getStoreStatus } from "@/lib/store-status";

const DELIVERY_FEE = 25;
const VALID_PAYMENT_METHODS: Array<PaymentMethod | "card"> = ["apple_pay", "google_pay", "eft", "card"];
const VALID_ORDER_TYPES = ["PICKUP", "DELIVERY"] as const;



export async function GET(req: NextRequest) {

  if (!isAdminRequest(req)) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }



  const orders = await prisma.order.findMany({

    orderBy: { createdAt: "desc" },

  });

  return NextResponse.json({ orders });

}



export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const {

      customerName,

      customerPhone,

      customerEmail,

      orderType,

      address,

      items,

      subtotal: submittedSubtotal,

      deliveryFee: submittedDeliveryFee,

      total: submittedTotal,

      paymentMethod,

    } = body;


    const storeStatus = await getStoreStatus();

    if (!storeStatus.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Lee-G's Pizza is currently closed for a moment. Please keep monitoring the website or contact Lee-G's on ${STORE_INFO.phone}.`,
        },
        { status: 403 }
      );
    }



    const name = typeof customerName === "string" ? customerName.trim() : "";
    const phone = typeof customerPhone === "string" ? customerPhone.trim() : "";
    const email =
      typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";
    const requestedOrderType = VALID_ORDER_TYPES.includes(orderType)
      ? orderType
      : "PICKUP";
    const deliveryAddress = typeof address === "string" ? address.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!isValidSouthAfricanPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid South African phone number, for example 078 123 4567.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (requestedOrderType === "DELIVERY" && deliveryAddress.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a complete delivery address for delivery orders.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty. Please add an item before checkout." },
        { status: 400 }
      );
    }

    const method = VALID_PAYMENT_METHODS.includes(paymentMethod)
      ? (paymentMethod as PaymentMethod | "card")
      : "card";
    const pricedOrder = await priceOrderItems(items);
    const finalDeliveryFee = requestedOrderType === "DELIVERY" ? DELIVERY_FEE : 0;
    const finalTotal = pricedOrder.subtotal + finalDeliveryFee;
    const submittedTotals = [submittedSubtotal, submittedDeliveryFee, submittedTotal].map(Number);

    if (
      submittedTotals.some((value) => Number.isNaN(value)) ||
      Math.abs((Number(submittedSubtotal) || 0) - pricedOrder.subtotal) > 0.01 ||
      Math.abs((Number(submittedDeliveryFee) || 0) - finalDeliveryFee) > 0.01 ||
      Math.abs((Number(submittedTotal) || 0) - finalTotal) > 0.01
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your cart total changed while checking out. Please refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    const orderChannel = "WEB";

    const isPaidOnline =

      method === "apple_pay" ||

      method === "google_pay" ||

      method === "card";



    const order = await prisma.order.create({

      data: {

        orderNumber: generateOrderNumber(),

        customerName: name,

        customerPhone: normalizeSouthAfricanPhone(phone),

        customerEmail: email,

        orderType: requestedOrderType,

        address: requestedOrderType === "DELIVERY" ? deliveryAddress : null,

        items: JSON.stringify(pricedOrder.items),

        subtotal: pricedOrder.subtotal,

        deliveryFee: finalDeliveryFee,

        total: finalTotal,

        channel: orderChannel,

        paymentMethod: method,

        paymentStatus: isPaidOnline ? "paid" : "pending",

        status: "RECEIVED",

      },

    });



    const notifications = await sendOrderConfirmationEmail({
      order,
      items: pricedOrder.items,
      orderType: requestedOrderType,
      address: requestedOrderType === "DELIVERY" ? deliveryAddress : null,
    });

    return NextResponse.json({ success: true, order, notifications });

  } catch (error) {

    console.error("Create order error:", error);

    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(

      { success: false, error: "Failed to create order" },

      { status: 500 }

    );

  }

}

class OrderValidationError extends Error {}

type IncomingCartItem = Partial<CartItem> & {
  toppings?: Array<{ id?: string; name?: string }>;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function isValidCrust(value: unknown): value is CrustType {
  return typeof value === "string" && value in CRUST_SURCHARGE;
}

async function priceOrderItems(rawItems: unknown): Promise<{
  items: CartItem[];
  subtotal: number;
}> {
  if (!Array.isArray(rawItems)) {
    throw new OrderValidationError("Your cart could not be read. Please refresh and try again.");
  }

  const products = await prisma.product.findMany({ where: { isActive: true } });
  const toppings = await prisma.topping.findMany({ where: { isActive: true } });

  const items = rawItems.map((rawItem, index) => {
    const item = rawItem as IncomingCartItem;
    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new OrderValidationError("Please keep item quantities between 1 and 20.");
    }

    const product = item.productId
      ? products.find((candidate) => candidate.id === item.productId)
      : products.find(
          (candidate) =>
            typeof item.name === "string" &&
            candidate.name.toLowerCase() === item.name.toLowerCase()
        );

    if (!product) {
      throw new OrderValidationError(
        `One item in your cart is no longer available. Please remove it and try again.`
      );
    }

    const isSide = product.category === "SIDE";
    const isFixedPriceItem = isSide || product.category === "COMBO";
    const rawSize = typeof item.size === "string" ? item.size : undefined;

    if (!isFixedPriceItem && rawSize && !/^(medium|large)$/i.test(rawSize)) {
      throw new OrderValidationError("Lee-G's only offers Medium and Large pizzas.");
    }

    const size = isFixedPriceItem ? undefined : normalizePizzaSize(rawSize);
    const crust = isFixedPriceItem ? undefined : isValidCrust(item.crust) ? item.crust : "Classic";
    let basePrice = getProductPrice(product, size);

    if (!isFixedPriceItem && size && crust) {
      basePrice += CRUST_SURCHARGE[crust][size];
    }

    if (basePrice <= 0) {
      throw new OrderValidationError(
        `${product.name} cannot be priced right now. Please remove it and try again.`
      );
    }

    const selectedToppings: CartItem["toppings"] = [];
    const seenToppings = new Set<string>();

    if (!isSide) {
      for (const rawTopping of item.toppings || []) {
        const topping = rawTopping.id
          ? toppings.find((candidate) => candidate.id === rawTopping.id)
          : toppings.find(
              (candidate) =>
                typeof rawTopping.name === "string" &&
                candidate.name.toLowerCase() === rawTopping.name.toLowerCase()
            );

        if (!topping) {
          throw new OrderValidationError(
            `One topping in your cart is no longer available. Please remove it and try again.`
          );
        }

        if (seenToppings.has(topping.id)) continue;
        seenToppings.add(topping.id);

        selectedToppings.push({
          id: topping.id,
          name: topping.name,
          price: getToppingPrice(topping),
        });
      }
    }

    const toppingsPrice = roundCurrency(
      selectedToppings.reduce((sum, topping) => sum + topping.price, 0)
    );
    const unitPrice = roundCurrency(basePrice + toppingsPrice);

    return {
      id: item.id || `${product.id}-${index}`,
      productId: product.id,
      name: product.name,
      size,
      crust,
      toppings: selectedToppings,
      basePrice: roundCurrency(basePrice),
      toppingsPrice,
      totalPrice: roundCurrency(unitPrice * quantity),
      quantity,
    };
  });

  return {
    items,
    subtotal: roundCurrency(items.reduce((sum, item) => sum + item.totalPrice, 0)),
  };
}



