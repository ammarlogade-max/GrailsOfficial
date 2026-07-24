import jsPDF from "jspdf";
import type { Order } from "../data/types";
import type { StoreSettings } from "../store/cmsStore";

function inr(n: number) {
  return `Rs. ${n.toFixed(2)}`;
}

/**
 * Generates a straightforward GST-style invoice PDF for an order and
 * triggers a download. Built with jsPDF directly (no server round-trip)
 * since everything needed — order, items, totals — is already loaded on
 * whichever page the "Download Invoice" button lives on.
 */
export function downloadInvoice(order: Order, settings: Pick<StoreSettings, "brandName" | "businessAddress" | "supportEmail" | "supportPhone">) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings.brandName, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  y += 18;
  doc.text(settings.businessAddress, margin, y, { maxWidth: 260 });
  y += 24;
  doc.text(`${settings.supportEmail}  ·  ${settings.supportPhone}`, margin, y);

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE", pageWidth - margin, 56, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.orderNumber}`, pageWidth - margin, 76, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, pageWidth - margin, 90, { align: "right" });
  doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, pageWidth - margin, 104, { align: "right" });

  y = 150;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.text(order.shippingName, margin, y);
  y += 14;
  doc.text(order.shippingPhone, margin, y);
  y += 14;
  doc.text(`${order.shippingLine1}${order.shippingLine2 ? ", " + order.shippingLine2 : ""}`, margin, y, { maxWidth: 260 });
  y += 14;
  doc.text(`${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}`, margin, y);

  y += 36;
  const colX = { item: margin, qty: 320, price: 390, total: 470 };
  doc.setFont("helvetica", "bold");
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 12, pageWidth - margin * 2, 20, "F");
  doc.text("Item", colX.item + 4, y + 2);
  doc.text("Qty", colX.qty, y + 2);
  doc.text("Price", colX.price, y + 2);
  doc.text("Total", colX.total, y + 2);
  y += 22;

  doc.setFont("helvetica", "normal");
  for (const item of order.items) {
    doc.text(`${item.productName}`, colX.item + 4, y, { maxWidth: 260 });
    doc.text(`Size ${item.size} · ${item.color}`, colX.item + 4, y + 12, { maxWidth: 260 });
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(inr(item.unitPrice), colX.price, y);
    doc.text(inr(item.unitPrice * item.quantity), colX.total, y);
    y += 30;
  }

  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const totalsX = colX.price;
  function totalRow(label: string, value: string, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX, y);
    doc.text(value, colX.total, y);
    y += 16;
  }
  totalRow("Subtotal", inr(order.subtotal));
  if (order.discountAmount > 0) totalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `- ${inr(order.discountAmount)}`);
  if (order.shippingCharge > 0) totalRow("Shipping", inr(order.shippingCharge));
  if (order.codCharge > 0) totalRow("COD Fee", inr(order.codCharge));
  y += 4;
  doc.setDrawColor(0);
  doc.line(totalsX - 10, y - 12, pageWidth - margin, y - 12);
  totalRow("Total", inr(order.total), true);

  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text("This is a computer-generated invoice and does not require a signature.", margin, y);

  doc.save(`Invoice-${order.orderNumber}.pdf`);
}
