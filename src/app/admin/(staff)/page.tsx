"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import {

  CalendarClock,

  ClipboardList,

  History,

  Mail,

  Power,

  Printer,

  RefreshCw,

  Search,

  Bell,

  Globe,

  MessageCircle,

  User,

} from "lucide-react";

import {

  cn,

  formatCurrency,

  STATUS_COLORS,

  STATUS_LABELS,

  type CartItem,

} from "@/lib/utils";



interface Order {

  id: string;

  orderNumber: string;

  customerName: string;

  customerPhone: string;

  customerEmail: string | null;

  orderType: string;

  address: string | null;

  items: string;

  subtotal: number;

  deliveryFee: number;

  total: number;

  status: string;

  channel: string;

  paymentMethod: string | null;

  paymentStatus: string;

  createdAt: string;

  completedAt: string | null;

}



const STATUS_OPTIONS = [

  "RECEIVED",

  "BAKING",

  "OUT_FOR_DELIVERY",

  "READY_FOR_PICKUP",

  "COMPLETED",

];



export default function AdminDashboard() {

  const [tab, setTab] = useState<"live" | "history">("live");

  const [revenueRange, setRevenueRange] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "daily"
  );

  const [orderFilter, setOrderFilter] = useState<
    "all" | "today" | "pending" | "completed" | "delivery" | "pickup"
  >("all");

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const [storeOpen, setStoreOpen] = useState(true);

  const [storeStatusLoading, setStoreStatusLoading] = useState(false);



  const fetchOrders = useCallback(async () => {

    try {

      const res = await fetch("/api/orders");

      const data = await res.json();

      setOrders(data.orders || []);

    } catch {

      /* ignore */

    } finally {

      setLoading(false);

    }

  }, []);


  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/store-status", { cache: "no-store" });
      const data = await res.json();
      setStoreOpen(data.isOpen !== false);
    } catch {
      /* keep current status */
    }
  }, []);



  useEffect(() => {

    fetchOrders();
    fetchStoreStatus();

    const interval = setInterval(fetchOrders, 15000);

    return () => clearInterval(interval);

  }, [fetchOrders, fetchStoreStatus]);



  const liveOrders = useMemo(

    () => orders.filter((o) => o.status !== "COMPLETED"),

    [orders]

  );



  const completedOrders = useMemo(

    () => orders.filter((o) => o.status === "COMPLETED"),

    [orders]

  );



  const revenueTotal = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const rangeStart = {
      daily: startOfToday,
      weekly: startOfWeek,
      monthly: startOfMonth,
      yearly: startOfYear,
    }[revenueRange];

    return completedOrders
      .filter((order) => new Date(order.completedAt || order.createdAt) >= rangeStart)
      .reduce((sum, order) => sum + order.total, 0);
  }, [completedOrders, revenueRange]);



  const filteredHistory = useMemo(() => {

    const today = new Date().toDateString();
    const q = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        (order.customerEmail || "").toLowerCase().includes(q);

      const matchesFilter =
        orderFilter === "all" ||
        (orderFilter === "today" &&
          new Date(order.completedAt || order.createdAt).toDateString() === today) ||
        (orderFilter === "pending" && order.status !== "COMPLETED") ||
        (orderFilter === "completed" && order.status === "COMPLETED") ||
        (orderFilter === "delivery" && order.orderType === "DELIVERY") ||
        (orderFilter === "pickup" && order.orderType === "PICKUP");

      return matchesSearch && matchesFilter;
    });

  }, [orderFilter, orders, search]);



  const updateStatus = async (orderId: string, status: string) => {

    const res = await fetch(`/api/orders/${orderId}`, {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ status }),

    });

    const data = await res.json();

    if (data.success) {

      setOrders((prev) =>

        prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))

      );

      const updatedOrder = data.order || orders.find((o) => o.id === orderId);
      const recipient = data.notification?.recipient || updatedOrder?.customerEmail;
      const mode = data.notification?.mock ? "Mock email" : "Email";
      const msg = data.notification?.sent
        ? `Email update sent to ${recipient}: Order ${updatedOrder?.orderNumber} is now "${STATUS_LABELS[status]}".`
        : `${mode} update was not delivered${recipient ? ` to ${recipient}` : ""}: ${
            data.notification?.error || "Customer email is missing."
          }`;

      setNotification(msg);

      setTimeout(() => setNotification(null), 5000);

    }

  };

  const toggleStoreStatus = async () => {
    const nextOpen = !storeOpen;
    setStoreStatusLoading(true);

    try {
      const res = await fetch("/api/store-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextOpen }),
      });
      const data = await res.json();

      if (!data.success) {
        setNotification(data.error || "Could not update store status.");
        return;
      }

      setStoreOpen(data.isOpen);
      setNotification(
        data.isOpen
          ? "Store is now open. Customers can place orders."
          : "Store is now closed. Customers will see a closed notice."
      );
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification("Could not update store status.");
    } finally {
      setStoreStatusLoading(false);
    }
  };

  const resendOrderEmail = async (order: Order) => {
    const res = await fetch(`/api/orders/${order.id}/resend-email`, {
      method: "POST",
    });
    const data = await res.json();
    const result = data.notifications?.[0];

    if (data.success && result?.sent) {
      setNotification(`Email confirmation resent to ${result.recipient}.`);
    } else {
      setNotification(
        result?.error || data.error || "Email confirmation could not be resent."
      );
    }

    setTimeout(() => setNotification(null), 5000);
  };

  const getPaymentLabel = (paymentStatus: string) =>
    paymentStatus === "paid" ? "Paid" : "Unpaid";

  const getPaymentClassName = (paymentStatus: string) =>
    paymentStatus === "paid"
      ? "border-green-500/30 bg-green-500/15 text-green-400"
      : "border-yellow-500/30 bg-yellow-500/15 text-yellow-300";

  const printOrder = (order: Order) => {
    const items = parseItems(order.items);
    const orderDateTime = formatOrderDateTime(order.createdAt);
    const receipt = window.open("", "_blank", "width=420,height=700");

    if (!receipt) {
      setNotification("Please allow popups to print the order receipt.");
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    receipt.document.write(`
      <html>
        <head>
          <title>Order ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 24px; }
            .muted { color: #666; font-size: 13px; }
            .section { border-top: 1px solid #ddd; margin-top: 16px; padding-top: 16px; }
            .row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; }
            .total { font-size: 20px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Lee-G's Pizza</h1>
          <p class="muted">Order ${order.orderNumber}</p>
          <p>${orderDateTime.date} at ${orderDateTime.time}</p>

          <div class="section">
            <strong>Customer</strong>
            <p>${escapePrintText(order.customerName)}<br />
            ${escapePrintText(order.customerPhone)}<br />
            ${escapePrintText(order.customerEmail || "")}</p>
          </div>

          <div class="section">
            <strong>${order.orderType === "DELIVERY" ? "Delivery" : "Pickup"}</strong>
            ${order.address ? `<p>${escapePrintText(order.address)}</p>` : ""}
          </div>

          <div class="section">
            <strong>Items</strong>
            ${items
              .map((item) => {
                const toppings = formatToppings(item);
                return `<div class="row"><span>${item.quantity}x ${escapePrintText(
                  item.name
                )}${item.size ? ` (${item.size})` : ""}${
                  toppings ? `<br /><small>${escapePrintText(toppings)}</small>` : ""
                }</span><span>${formatCurrency(item.totalPrice)}</span></div>`;
              })
              .join("")}
          </div>

          <div class="section">
            <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
            <div class="row"><span>Delivery</span><span>${formatCurrency(order.deliveryFee)}</span></div>
            <div class="row total"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
            <p class="muted">Payment: ${escapePrintText(getPaymentLabel(order.paymentStatus))}</p>
            <p class="muted">Status: ${escapePrintText(STATUS_LABELS[order.status] || order.status)}</p>
          </div>
        </body>
      </html>
    `);
    receipt.document.close();
    receipt.focus();
    receipt.print();
  };



  const parseItems = (itemsJson: string): CartItem[] => {

    try {

      return JSON.parse(itemsJson);

    } catch {

      return [];

    }

  };

  const formatToppings = (item: CartItem) => {
    if (!item.toppings?.length) return null;
    return item.toppings
      .map((topping) => `${topping.name}${topping.price ? ` (+${formatCurrency(topping.price)})` : ""}`)
      .join(", ");
  };

  const formatOrderDateTime = (value: string) => {
    const date = new Date(value);

    return {
      date: date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const escapePrintText = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");



  return (

    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="section-title">ADMIN</h1>

          <p className="text-stone-400">Lee-G&apos;s Pizza — Order Management</p>

        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleStoreStatus}
            disabled={storeStatusLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
              storeOpen
                ? "border-green-500/30 bg-green-500/15 text-green-400 hover:bg-green-500/20"
                : "border-red-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/20"
            )}
          >
            <Power className="h-4 w-4" />
            {storeStatusLoading ? "Updating..." : storeOpen ? "Store Open" : "Store Closed"}
          </button>

          <button onClick={fetchOrders} className="btn-secondary !py-2 !px-4 text-sm">

            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />

            Refresh

          </button>
        </div>

      </div>



      {notification && (

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 animate-fade-in">

          <Bell className="h-4 w-4 shrink-0" />

          {notification}

        </div>

      )}



      <div className="mb-8 flex gap-2">

        <button

          onClick={() => setTab("live")}

          className={cn(

            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",

            tab === "live"

              ? "bg-brand-orange/15 text-brand-orange"

              : "text-stone-400 hover:text-white"

          )}

        >

          <ClipboardList className="h-4 w-4" />

          Live Orders

          {liveOrders.length > 0 && (

            <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs text-white">

              {liveOrders.length}

            </span>

          )}

        </button>

        <button

          onClick={() => setTab("history")}

          className={cn(

            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",

            tab === "history"

              ? "bg-brand-orange/15 text-brand-orange"

              : "text-stone-400 hover:text-white"

          )}

        >

          <History className="h-4 w-4" />

          Order History

        </button>

      </div>



      {tab === "live" && (

        <div>

          {liveOrders.length === 0 ? (

            <div className="card p-12 text-center">

              <ClipboardList className="mx-auto h-12 w-12 text-stone-600" />

              <p className="mt-4 text-stone-400">No active orders right now.</p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {liveOrders.map((order) => {

                const items = parseItems(order.items);
                const orderDateTime = formatOrderDateTime(order.createdAt);

                return (

                  <div key={order.id} className="card p-5">

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <p className="font-mono text-sm text-brand-orange">

                          {order.orderNumber}

                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <User className="h-4 w-4 text-brand-orange" />
                          <h3 className="font-semibold text-white">

                            {order.customerName}

                          </h3>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                          <CalendarClock className="h-4 w-4" />
                          <span>
                            {orderDateTime.date} at {orderDateTime.time}
                          </span>
                        </div>

                        <p className="text-sm text-stone-400">{order.customerPhone}</p>
                        {order.customerEmail && (
                          <p className="text-xs text-stone-500">{order.customerEmail}</p>
                        )}

                      </div>

                      <div className="flex items-center gap-1.5">

                        {order.channel === "WHATSAPP" ? (

                          <MessageCircle className="h-4 w-4 text-green-400" />

                        ) : (

                          <Globe className="h-4 w-4 text-blue-400" />

                        )}

                        <span className="text-xs text-stone-500">{order.channel}</span>

                      </div>

                    </div>



                    <div className="mt-3 space-y-1 text-sm text-stone-400">

                      <p>

                        {order.orderType === "DELIVERY" ? "🚗 Delivery" : "🏪 Pickup"}

                        {order.address && ` — ${order.address}`}

                      </p>

                      {items.map((item, i) => {
                        const toppings = formatToppings(item);

                        return (
                          <div key={i}>
                            <p>
                              {item.quantity}x {item.name}
                              {item.size ? ` (${item.size})` : ""}
                            </p>
                            {toppings && (
                              <p className="ml-4 text-xs text-brand-orange">
                                Toppings: {toppings}
                              </p>
                            )}
                          </div>
                        );
                      })}

                    </div>



                    <p className="mt-3 text-lg font-bold text-brand-gold">

                      {formatCurrency(order.total)}

                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                          getPaymentClassName(order.paymentStatus)
                        )}
                      >
                        {getPaymentLabel(order.paymentStatus)}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-xs uppercase text-stone-500">
                          {order.paymentMethod.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => printOrder(order)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-charcoal-600 px-3 py-2 text-xs font-semibold text-stone-300 hover:border-brand-orange hover:text-brand-orange"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => resendOrderEmail(order)}
                        disabled={!order.customerEmail}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-charcoal-600 px-3 py-2 text-xs font-semibold text-stone-300 hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Resend
                      </button>
                    </div>



                    <div className="mt-4">

                      <label className="mb-1.5 block text-xs text-stone-500">Status</label>

                      <select

                        value={order.status}

                        onChange={(e) => updateStatus(order.id, e.target.value)}

                        className="w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"

                      >

                        {STATUS_OPTIONS.map((s) => (

                          <option key={s} value={s} className="bg-charcoal-900 text-white">

                            {STATUS_LABELS[s]}

                          </option>

                        ))}

                      </select>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      )}



      {tab === "history" && (

        <div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div className="card flex flex-wrap items-center gap-3 px-5 py-3">

              <span className="text-sm text-stone-400">Revenue</span>

              <select
                value={revenueRange}
                onChange={(e) =>
                  setRevenueRange(e.target.value as "daily" | "weekly" | "monthly" | "yearly")
                }
                className="rounded-lg border border-charcoal-600 bg-charcoal-900 px-2 py-1 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
              >
                <option value="daily" className="bg-charcoal-900 text-white">
                  Daily
                </option>
                <option value="weekly" className="bg-charcoal-900 text-white">
                  Weekly
                </option>
                <option value="monthly" className="bg-charcoal-900 text-white">
                  Monthly
                </option>
                <option value="yearly" className="bg-charcoal-900 text-white">
                  Yearly
                </option>
              </select>

              <span className="text-2xl font-bold text-brand-gold">

                {formatCurrency(revenueTotal)}

              </span>

            </div>


            <div className="card flex items-center gap-3 px-5 py-3">
              <span className="text-sm text-stone-400">Filter</span>
              <select
                value={orderFilter}
                onChange={(e) =>
                  setOrderFilter(
                    e.target.value as
                      | "all"
                      | "today"
                      | "pending"
                      | "completed"
                      | "delivery"
                      | "pickup"
                  )
                }
                className="rounded-lg border border-charcoal-600 bg-charcoal-900 px-2 py-1 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
              >
                <option value="all" className="bg-charcoal-900 text-white">
                  All Orders
                </option>
                <option value="today" className="bg-charcoal-900 text-white">
                  Today
                </option>
                <option value="pending" className="bg-charcoal-900 text-white">
                  Pending
                </option>
                <option value="completed" className="bg-charcoal-900 text-white">
                  Completed
                </option>
                <option value="delivery" className="bg-charcoal-900 text-white">
                  Delivery
                </option>
                <option value="pickup" className="bg-charcoal-900 text-white">
                  Pickup
                </option>
              </select>
            </div>



            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />

              <input

                type="text"

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder="Search orders..."

                className="input-field !py-2.5 !pl-10 text-sm"

              />

            </div>

          </div>



          <div className="card overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-charcoal-700 text-left text-stone-400">

                    <th className="px-5 py-3 font-medium">Order #</th>

                    <th className="px-5 py-3 font-medium">Customer</th>

                    <th className="px-5 py-3 font-medium">Items</th>

                    <th className="px-5 py-3 font-medium">Channel</th>

                    <th className="px-5 py-3 font-medium">Type</th>

                    <th className="px-5 py-3 font-medium">Status</th>

                    <th className="px-5 py-3 font-medium">Payment</th>

                    <th className="px-5 py-3 font-medium">Total</th>

                    <th className="px-5 py-3 font-medium">Date & Time</th>

                    <th className="px-5 py-3 font-medium">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredHistory.length === 0 ? (

                    <tr>

                      <td colSpan={10} className="px-5 py-12 text-center text-stone-500">

                        {search.trim() || orderFilter !== "completed"
                          ? "No orders found."
                          : "No completed orders found."}

                      </td>

                    </tr>

                  ) : (

                    filteredHistory.map((order) => {
                      const orderDateTime = formatOrderDateTime(order.completedAt || order.createdAt);

                      return (

                      <tr

                        key={order.id}

                        className="border-b border-charcoal-800 transition-colors hover:bg-charcoal-800/50"

                      >

                        <td className="px-5 py-3 font-mono text-brand-orange">

                          {order.orderNumber}

                        </td>

                        <td className="px-5 py-3">

                          <p className="font-medium text-white">{order.customerName}</p>

                          <p className="text-xs text-stone-500">{order.customerPhone}</p>
                          {order.customerEmail && (
                            <p className="text-xs text-stone-500">{order.customerEmail}</p>
                          )}

                        </td>

                        <td className="px-5 py-3 text-stone-400">
                          {parseItems(order.items).map((item, i) => {
                            const toppings = formatToppings(item);

                            return (
                              <div key={i} className="mb-2 last:mb-0">
                                <p>
                                  {item.quantity}x {item.name}
                                  {item.size ? ` (${item.size})` : ""}
                                </p>
                                {toppings && (
                                  <p className="text-xs text-brand-orange">
                                    Toppings: {toppings}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </td>

                        <td className="px-5 py-3">

                          <span

                            className={cn(

                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",

                              order.channel === "WHATSAPP"

                                ? "bg-green-500/15 text-green-400"

                                : "bg-blue-500/15 text-blue-400"

                            )}

                          >

                            {order.channel === "WHATSAPP" ? (

                              <MessageCircle className="h-3 w-3" />

                            ) : (

                              <Globe className="h-3 w-3" />

                            )}

                            {order.channel}

                          </span>

                        </td>

                        <td className="px-5 py-3 text-stone-400">{order.orderType}</td>

                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              STATUS_COLORS[order.status]
                            )}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                              getPaymentClassName(order.paymentStatus)
                            )}
                          >
                            {getPaymentLabel(order.paymentStatus)}
                          </span>
                          {order.paymentMethod && (
                            <p className="mt-1 text-xs uppercase text-stone-600">
                              {order.paymentMethod.replace("_", " ")}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3 font-semibold text-brand-gold">

                          {formatCurrency(order.total)}

                        </td>

                        <td className="px-5 py-3 text-stone-500">
                          <p>{orderDateTime.date}</p>
                          <p className="text-xs text-stone-600">{orderDateTime.time}</p>

                        </td>

                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => printOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-charcoal-600 px-2 py-1 text-xs text-stone-300 hover:border-brand-orange hover:text-brand-orange"
                            >
                              <Printer className="h-3 w-3" />
                              Print
                            </button>
                            <button
                              type="button"
                              onClick={() => resendOrderEmail(order)}
                              disabled={!order.customerEmail}
                              className="inline-flex items-center gap-1 rounded-lg border border-charcoal-600 px-2 py-1 text-xs text-stone-300 hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Mail className="h-3 w-3" />
                              Resend
                            </button>
                          </div>
                        </td>

                      </tr>

                      );
                    })

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


