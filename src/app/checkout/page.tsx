"use client";



import { useState } from "react";

import Link from "next/link";

import {

  ArrowLeft,

  Minus,

  Plus,

  Trash2,

  CheckCircle,

  Building2,

  Smartphone,

} from "lucide-react";

import { useCart } from "@/lib/cart-context";

import {
  formatCurrency,
  isValidEmail,
  isValidSouthAfricanPhone,
  normalizeSouthAfricanPhone,
  STORE_INFO,
} from "@/lib/utils";

import {

  EFT_BANK_DETAILS,

  PAYMENT_METHODS,

  processPayment,

  type PaymentMethod,

} from "@/lib/payments";

import { cn } from "@/lib/utils";



const DELIVERY_FEE = 25;



export default function CheckoutPage() {

  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [orderType, setOrderType] = useState<"PICKUP" | "DELIVERY">("PICKUP");

  const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const [loading, setLoading] = useState(false);

  const [checkoutError, setCheckoutError] = useState("");

  const [orderComplete, setOrderComplete] = useState<{

    orderNumber: string;

    channel: string;

    paymentMethod?: PaymentMethod;

    notifications?: Array<{
      sent: boolean;
      mock?: boolean;
      recipient: string;
      error?: string;
    }>;

  } | null>(null);



  const deliveryFee = orderType === "DELIVERY" ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;



  const handleOnlineOrder = async () => {
    setCheckoutError("");

    const customerName = name.trim();
    const customerPhone = phone.trim();
    const customerEmail = email.trim().toLowerCase();
    const deliveryAddress = address.trim();

    if (!customerName) {

      setCheckoutError("Please enter your name so we know who the order is for.");

      return;

    }

    if (!customerPhone) {

      setCheckoutError("Please enter your South African phone number.");

      return;

    }

    if (!isValidSouthAfricanPhone(customerPhone)) {

      setCheckoutError("Please enter a valid South African phone number, for example 078 123 4567.");

      return;

    }

    if (!customerEmail) {

      setCheckoutError("Please enter your email address for order confirmation.");

      return;

    }

    if (!isValidEmail(customerEmail)) {

      setCheckoutError("Please enter a valid email address, for example name@example.com.");

      return;

    }

    if (orderType === "DELIVERY" && !deliveryAddress) {

      setCheckoutError("Please enter your delivery address.");

      return;

    }

    if (orderType === "DELIVERY" && deliveryAddress.length < 8) {

      setCheckoutError("Please enter a complete delivery address so the driver can find you.");

      return;

    }

    if (items.length === 0) {

      setCheckoutError("Your cart is empty. Please add an item before checkout.");

      return;

    }

    if (!paymentMethod) {

      setCheckoutError("Please select a payment method.");

      return;

    }



    setLoading(true);

    try {

      const statusRes = await fetch("/api/store-status", { cache: "no-store" });
      const statusData = await statusRes.json();

      if (statusData.isOpen === false) {
        setCheckoutError(
          `Lee-G's Pizza is currently closed for a moment. Please keep monitoring the website or contact us on ${STORE_INFO.phone}.`
        );
        return;
      }

      const payment = await processPayment(paymentMethod, total, "PENDING");



      if (!payment.success) {

        setCheckoutError(payment.error || "Payment failed. Please try again.");

        return;

      }



      const res = await fetch("/api/orders", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          customerName,

          customerPhone: normalizeSouthAfricanPhone(customerPhone),

          customerEmail,

          orderType,

          address: orderType === "DELIVERY" ? deliveryAddress : null,

          items,

          subtotal,

          deliveryFee,

          total,

          channel: "WEB",

          paymentMethod,

        }),

      });



      const data = await res.json();

      if (data.success) {

        setOrderComplete({

          orderNumber: data.order.orderNumber,

          channel: "WEB",

          paymentMethod,

          notifications: data.notifications || [],

        });

        clearCart();

      } else {

        setCheckoutError(data.error || "Order failed. Please try again.");

      }

    } catch {

      setCheckoutError("Something went wrong. Please try again.");

    } finally {

      setLoading(false);

    }

  };


  if (orderComplete) {

    const isEft = orderComplete.paymentMethod === "eft";
    const sentEmailNotifications =
      orderComplete.notifications?.filter((notification) => notification.sent) || [];
    const failedEmailNotifications =
      orderComplete.notifications?.filter((notification) => !notification.sent) || [];



    return (

      <div className="mx-auto max-w-lg px-4 py-20 text-center">

        <CheckCircle className="mx-auto h-16 w-16 text-green-400" />

        <h1 className="mt-6 font-display text-4xl text-white">Order Placed!</h1>

        <p className="mt-2 text-stone-400">

          Order <span className="font-mono text-brand-orange">{orderComplete.orderNumber}</span>{" "}

          has been received.

        </p>



        {isEft && (

          <div className="card mt-6 p-5 text-left text-sm">

            <h3 className="font-semibold text-white">EFT Payment Details</h3>

            <div className="mt-3 space-y-1.5 text-stone-400">

              <p>

                <span className="text-stone-500">Bank:</span> {EFT_BANK_DETAILS.bank}

              </p>

              <p>

                <span className="text-stone-500">Account:</span> {EFT_BANK_DETAILS.accountName}

              </p>

              <p>

                <span className="text-stone-500">Account No:</span>{" "}

                {EFT_BANK_DETAILS.accountNumber}

              </p>

              <p>

                <span className="text-stone-500">Branch:</span> {EFT_BANK_DETAILS.branchCode}

              </p>

              <p className="pt-2 font-medium text-brand-orange">

                Reference: {orderComplete.orderNumber}

              </p>

            </div>

            <p className="mt-3 text-xs text-stone-500">

              Please use your order number as the payment reference. We&apos;ll confirm once

              payment is received.

            </p>

          </div>

        )}



        <div className="mt-5 space-y-3">
          {sentEmailNotifications.length > 0 ? (
            <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
              Email confirmation sent to {sentEmailNotifications[0].recipient}.
              Status changes will also be emailed to this address.
            </p>
          ) : (
            <p className="text-sm text-stone-400">
              We will send confirmation and status updates to the email address you entered.
            </p>
          )}

          {failedEmailNotifications.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-left text-sm text-yellow-100">
              <p className="font-semibold text-yellow-300">
                Email confirmation not delivered automatically.
              </p>
              <p className="mt-2 text-yellow-100/80">
                {failedEmailNotifications[0].error ||
                  "Please contact Lee-G's if you do not receive your confirmation email."}
              </p>
            </div>
          )}
        </div>



        {(orderComplete.paymentMethod === "apple_pay" ||

          orderComplete.paymentMethod === "google_pay") && (

          <p className="mt-4 text-sm text-green-400">Payment confirmed successfully.</p>

        )}



        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/track?order=${encodeURIComponent(orderComplete.orderNumber)}`}
            className="btn-primary inline-flex"
          >
            Track Order Status
          </Link>

          <Link href="/" className="btn-secondary inline-flex">
            Back to Menu
          </Link>
        </div>

      </div>

    );

  }



  if (items.length === 0) {

    return (

      <div className="mx-auto max-w-lg px-4 py-20 text-center">

        <h1 className="font-display text-4xl text-white">Your Cart is Empty</h1>

        <p className="mt-2 text-stone-400">Add some delicious pizzas first!</p>

        <Link href="/" className="btn-primary mt-8 inline-flex">

          <ArrowLeft className="h-4 w-4" />

          Browse Menu

        </Link>

      </div>

    );

  }



  return (

    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">

      <Link

        href="/"

        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-400 hover:text-brand-orange"

      >

        <ArrowLeft className="h-4 w-4" />

        Back to Menu

      </Link>



      <h1 className="section-title mb-8">CHECKOUT</h1>



      <div className="grid gap-8 lg:grid-cols-5">

        <div className="lg:col-span-3 space-y-4">

          <h2 className="text-lg font-semibold text-white">Your Order</h2>

          {items.map((item) => (

            <div key={item.id} className="card flex gap-4 p-4">

              <div className="flex-1">

                <h3 className="font-semibold text-white">{item.name}</h3>

                <p className="text-sm text-stone-400">

                  {[item.size, item.crust].filter(Boolean).join(" • ")}

                  {item.toppings.length > 0 &&

                    ` • +${item.toppings.map((t) => t.name).join(", ")}`}

                </p>

                <p className="mt-1 font-bold text-brand-gold">

                  {formatCurrency(item.totalPrice)}

                </p>

              </div>

              <div className="flex flex-col items-end justify-between">

                <button

                  onClick={() => removeItem(item.id)}

                  className="text-stone-500 hover:text-brand-red"

                >

                  <Trash2 className="h-4 w-4" />

                </button>

                <div className="flex items-center gap-2">

                  <button

                    onClick={() => updateQuantity(item.id, item.quantity - 1)}

                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-charcoal-600 text-sm hover:border-brand-orange"

                  >

                    <Minus className="h-3 w-3" />

                  </button>

                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>

                  <button

                    onClick={() => updateQuantity(item.id, item.quantity + 1)}

                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-charcoal-600 text-sm hover:border-brand-orange"

                  >

                    <Plus className="h-3 w-3" />

                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>



        <div className="lg:col-span-2">

          <div className="card sticky top-24 space-y-5 p-6">

            <h2 className="text-lg font-semibold text-white">Details</h2>



            <div>

              <label className="mb-1.5 block text-sm text-stone-400">Name</label>

              <input

                type="text"

                value={name}

                onChange={(e) => setName(e.target.value)}

                className="input-field"

                placeholder="Your name"

              />

            </div>


            <div>

              <label className="mb-1.5 block text-sm text-stone-400">Email</label>

              <input

                type="email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                className="input-field"

                placeholder="you@example.com"

              />

            </div>



            <div>

              <label className="mb-1.5 block text-sm text-stone-400">Phone</label>

              <input

                type="tel"

                value={phone}

                onChange={(e) => setPhone(e.target.value)}

                className="input-field"

                placeholder="071 234 5678"

              />

            </div>



            <div>

              <label className="mb-1.5 block text-sm text-stone-400">Order Type</label>

              <div className="grid grid-cols-2 gap-2">

                {(["PICKUP", "DELIVERY"] as const).map((type) => (

                  <button

                    key={type}

                    onClick={() => setOrderType(type)}

                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${

                      orderType === type

                        ? "border-brand-orange bg-brand-orange/10 text-brand-orange"

                        : "border-charcoal-600 text-stone-400 hover:border-charcoal-500"

                    }`}

                  >

                    {type === "PICKUP" ? "Pickup" : "Delivery"}

                  </button>

                ))}

              </div>

            </div>



            {orderType === "DELIVERY" && (

              <div>

                <label className="mb-1.5 block text-sm text-stone-400">Delivery Address</label>

                <textarea

                  value={address}

                  onChange={(e) => setAddress(e.target.value)}

                  className="input-field min-h-[80px] resize-none"

                  placeholder="Street address in Phalaborwa"

                />

              </div>

            )}



            <div>

              <label className="mb-3 block text-sm font-semibold text-stone-400">

                Payment Method

              </label>

              <div className="space-y-2">

                {PAYMENT_METHODS.map((method) => (

                  <button

                    key={method.id}

                    type="button"

                    onClick={() => setPaymentMethod(method.id)}

                    className={cn(

                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",

                      paymentMethod === method.id

                        ? "border-brand-orange bg-brand-orange/10"

                        : "border-charcoal-600 hover:border-charcoal-500"

                    )}

                  >

                    <div

                      className={cn(

                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",

                        method.id === "apple_pay" && "bg-black text-white",

                        method.id === "google_pay" && "bg-white text-charcoal-900",

                        method.id === "eft" && "bg-blue-500/15 text-blue-400"

                      )}

                    >

                      {method.id === "eft" ? (

                        <Building2 className="h-5 w-5" />

                      ) : (

                        <Smartphone className="h-5 w-5" />

                      )}

                    </div>

                    <div className="flex-1">

                      <p className="font-medium text-white">{method.label}</p>

                      <p className="text-xs text-stone-500">{method.description}</p>

                    </div>

                    <div

                      className={cn(

                        "h-4 w-4 shrink-0 rounded-full border-2",

                        paymentMethod === method.id

                          ? "border-brand-orange bg-brand-orange"

                          : "border-charcoal-500"

                      )}

                    />

                  </button>

                ))}

              </div>



              {paymentMethod === "eft" && (

                <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-stone-400">

                  <p className="font-medium text-stone-300">Bank: {EFT_BANK_DETAILS.bank}</p>

                  <p>Account: {EFT_BANK_DETAILS.accountName}</p>

                  <p>Ref: Your order number (shown after placing order)</p>

                </div>

              )}

            </div>



            <div className="space-y-2 border-t border-charcoal-700 pt-4 text-sm">

              <div className="flex justify-between text-stone-400">

                <span>Subtotal</span>

                <span>{formatCurrency(subtotal)}</span>

              </div>

              {deliveryFee > 0 && (

                <div className="flex justify-between text-stone-400">

                  <span>Delivery</span>

                  <span>{formatCurrency(deliveryFee)}</span>

                </div>

              )}

              <div className="flex justify-between text-lg font-bold text-white">

                <span>Total</span>

                <span className="text-brand-gold">{formatCurrency(total)}</span>

              </div>

            </div>



            <button

              onClick={handleOnlineOrder}

              disabled={loading || !paymentMethod}

              className={cn(

                "w-full rounded-xl px-6 py-3 font-semibold transition-all",

                paymentMethod === "apple_pay"

                  ? "bg-black text-white hover:bg-charcoal-900 disabled:opacity-50"

                  : paymentMethod === "google_pay"

                    ? "bg-white text-charcoal-900 hover:bg-stone-100 disabled:opacity-50"

                    : "btn-primary disabled:opacity-50"

              )}

            >

              {loading

                ? "Processing..."

                : paymentMethod === "apple_pay"

                  ? " Pay with Apple Pay"

                  : paymentMethod === "google_pay"

                    ? " Pay with Google Pay"

                    : paymentMethod === "eft"

                      ? "Place Order & Pay via EFT"

                      : "Pay Online & Order"}

            </button>


            {checkoutError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">
                {checkoutError}
              </p>
            )}



            <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-center text-xs text-green-300">
              Order confirmation and status updates will be sent by email.
            </p>



            <p className="text-center text-xs text-stone-500">

              Online payments are simulated. Real Stripe/PayFast integration can be added later.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}


