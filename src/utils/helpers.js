// src/utils/helpers.js
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function normalizeProduct(product) {
  const fromLegacyPrice = parseFloat(product?.price ?? 0) || 0;
  const oldPrice = parseFloat(product?.oldPrice ?? product?.price ?? 0) || 0;
  const newPrice = parseFloat(product?.newPrice ?? product?.price ?? oldPrice) || 0;

  return {
    ...product,
    oldPrice: oldPrice || fromLegacyPrice,
    newPrice: newPrice || fromLegacyPrice,
    price: oldPrice || fromLegacyPrice,
  };
}

export function getProductPrice(product, priceType = "oldPrice") {
  const normalized = normalizeProduct(product);
  if (priceType === "newPrice") return normalized.newPrice;
  return normalized.oldPrice;
}

export function getWeekOfMonth(date) {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  return Math.ceil((d.getDate() + firstDay) / 7);
}

export function generateOrderNo(date, existingOrders) {
  const d = new Date(date);
  const month = MONTH_NAMES[d.getMonth()];
  const week = getWeekOfMonth(d);
  const weekStr = "W" + week;
  const same = existingOrders.filter((o) => {
    if (!o.orderNo) return false;
    const p = o.orderNo.split("-");
    return p.length === 3 && p[1] === weekStr && p[2] === month;
  });
  return String(same.length + 1).padStart(2, "0") + "-" + weekStr + "-" + month;
}

export function calcTotal(products) {
  return products.reduce((s, p) => s + (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0), 0);
}

export function compareOrders(a, b) {
  const dateDiff = (b.date || "").localeCompare(a.date || "");
  if (dateDiff !== 0) return dateDiff;

  const aNo = String(a.orderNo || "");
  const bNo = String(b.orderNo || "");
  if (aNo === bNo) return 0;

  return bNo.localeCompare(aNo, undefined, { numeric: true, sensitivity: "base" });
}

export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export const emptyProduct = () => ({ name: "", qty: "", price: "" });

export function newEmptyOrder(existingOrders, customer) {
  const today = todayISO();
  return {
    date: today,
    orderNo: generateOrderNo(today, existingOrders || []),
    customerName: customer.name || "",
    customerPhone: customer.phone || "",
    customerAddress: customer.branch || "",
    customerArea: customer.area || "",
    courier: customer.courier || "",
    customerId: customer.id,
    priceType: customer?.priceType || "oldPrice",
    products: [emptyProduct()],
    note: "",
    _isExisting: false,
  };
}
