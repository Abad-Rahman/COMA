// src/utils/downloadInvoice.js
import { LOGO_B64 } from "./logoData";
import { SIGNATURE_B64 } from "./signatureData";
import { calcTotal, formatDate } from "./helpers";

export function downloadOrderImage(order) {
  const canvas = document.createElement("canvas");
  const W = 800;
  const products = order.products.filter((p) => p.name);
  const rowH = 36,
    headerH = 285,
    tableHeaderH = 40,
    footerH = 150,
    noteH = order.note ? 80 : 0;
  const H = headerH + tableHeaderH + products.length * rowH + 50 + noteH + footerH;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1b5e20";
  ctx.fillRect(0, 0, W, 88);
  const img = new Image();
  img.onload = () => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(58, 44, 36, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 22, 8, 72, 72);
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Chitra Laboratories (Unani)", 108, 38);
    ctx.font = "13px Arial";
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText("Order Invoice", 108, 60);
    ctx.fillStyle = "#e8f5e9";
    ctx.fillRect(0, 88, W, 5);
    ctx.fillStyle = "#388e3c";
    ctx.font = "bold 13px Arial";
    ctx.fillText("Order No: " + (order.orderNo || "—"), 28, 122);
    ctx.fillStyle = "#555";
    ctx.font = "13px Arial";
    ctx.fillText("Date: " + formatDate(order.date), 28, 144);
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 18px Arial";
    ctx.fillText(order.customerName || "—", 28, 182);
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.fillText(order.customerPhone || "", 28, 204);
    ctx.textAlign = "right";
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 13px Arial";
    ctx.fillText(order.courier || "", W - 28, 182);
    ctx.fillStyle = "#555";
    ctx.font = "13px Arial";
    ctx.fillText(order.customerAddress || "", W - 28, 204);
    ctx.textAlign = "left";
    ctx.strokeStyle = "#c8e6c9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, 224);
    ctx.lineTo(W - 28, 224);
    ctx.stroke();
    const ty = 244;
    ctx.fillStyle = "#e8f5e9";
    ctx.fillRect(18, ty - 14, W - 36, tableHeaderH);
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 12px Arial";
    const cols = [38, 64, 440, 545, 630, 730];
    ["SL", "Product Name", "Price (৳)", "Qty", "Total (৳)"].forEach((h, i) => {
      if (i >= 2) {
        ctx.textAlign = "right";
        ctx.fillText(h, cols[i + 1], ty + 12);
        ctx.textAlign = "left";
      } else ctx.fillText(h, cols[i], ty + 12);
    });
    let total = 0;
    products.forEach((p, i) => {
      const ry = ty + tableHeaderH + i * rowH;
      ctx.fillStyle = i % 2 === 0 ? "#fff" : "#f9fdf9";
      ctx.fillRect(18, ry, W - 36, rowH);
      ctx.fillStyle = "#888";
      ctx.font = "12px Arial";
      ctx.fillText(String(i + 1), cols[0], ry + 22);
      ctx.fillStyle = "#222";
      ctx.font = "13px Arial";
      ctx.fillText(p.name, cols[1], ry + 22);
      const qty = parseFloat(p.qty) || 0,
        price = parseFloat(p.price) || 0,
        row = qty * price;
      total += row;
      ctx.textAlign = "right";
      ctx.fillStyle = "#333";
      ctx.fillText("৳" + price.toFixed(0), cols[3], ry + 22);
      ctx.fillText(qty.toFixed(0), cols[4], ry + 22);
      ctx.fillStyle = "#1b5e20";
      ctx.font = "bold 13px Arial";
      ctx.fillText("৳" + row.toFixed(0), cols[5], ry + 22);
      ctx.textAlign = "left";
    });
    const totalY = ty + tableHeaderH + products.length * rowH + 14;
    ctx.fillStyle = "#e8f5e9";
    ctx.fillRect(18, totalY, W - 36, 44);
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 15px Arial";
    ctx.fillText("Grand Total", 28, totalY + 28);
    ctx.textAlign = "right";
    ctx.font = "bold 20px Arial";
    ctx.fillText("৳ " + total.toFixed(2), W - 28, totalY + 28);
    ctx.textAlign = "left";
    if (order.note) {
      const nY = totalY + 58;
      ctx.fillStyle = "#fff8f0";
      ctx.fillRect(18, nY, W - 36, 58);
      ctx.fillStyle = "#795548";
      ctx.font = "13px Arial";
      ctx.fillText("Note: " + order.note, 28, nY + 30);
    }
    const sigY = H - 110;
    ctx.strokeStyle = "#c8e6c9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, sigY);
    ctx.lineTo(W - 28, sigY);
    ctx.stroke();
    const sigImg = new Image();
    sigImg.onload = () => {
      // Draw signature image right-aligned, proportional, max 80x32
      const maxW = 80, maxH = 32;
      const ratio = Math.min(maxW / sigImg.width, maxH / sigImg.height);
      const sW = sigImg.width * ratio, sH = sigImg.height * ratio;
      ctx.drawImage(sigImg, W - 38 - sW, sigY + 8, sW, sH);
      ctx.fillStyle = "#888";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText("Order Created By", W - 38, sigY + sH + 20);
      ctx.textAlign = "left";
      ctx.strokeStyle = "#c8e6c9";
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, W - 6, H - 6);
      const link = document.createElement("a");
      link.download = "Order_" + (order.orderNo || "invoice") + ".jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
    sigImg.src = SIGNATURE_B64;
  };
  img.src = LOGO_B64;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ডাউনলোড ইনভয়েসের (canvas image) মতোই দেখতে একটা প্রিন্টযোগ্য ইনভয়েস বানায়,
// সরাসরি পুরো ফর্ম (ইনপুট বক্সসহ) প্রিন্ট না করে শুধু এই ক্লিন ইনভয়েসটাই প্রিন্ট করে।
export function printOrderInvoice(order) {
  const products = order.products.filter((p) => p.name);
  const total = calcTotal(products);

  const rows = products
    .map((p, i) => {
      const qty = parseFloat(p.qty) || 0;
      const price = parseFloat(p.price) || 0;
      const rowTotal = qty * price;
      return `
        <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fdf9"}">
          <td style="padding:8px 6px;color:#888;border-bottom:1px solid #f1f8e9;">${i + 1}</td>
          <td style="padding:8px 6px;color:#222;border-bottom:1px solid #f1f8e9;">${escapeHtml(p.name)}</td>
          <td style="padding:8px 6px;color:#333;text-align:right;border-bottom:1px solid #f1f8e9;">৳${price.toFixed(0)}</td>
          <td style="padding:8px 6px;color:#333;text-align:right;border-bottom:1px solid #f1f8e9;">${qty.toFixed(0)}</td>
          <td style="padding:8px 6px;color:#1b5e20;font-weight:700;text-align:right;border-bottom:1px solid #f1f8e9;">৳${rowTotal.toFixed(0)}</td>
        </tr>`;
    })
    .join("");

  const noteHtml = order.note
    ? `<div style="background:#fff8f0;border-radius:6px;padding:10px 14px;margin:14px 22px 0;color:#795548;font-size:13px;">Note: ${escapeHtml(order.note)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Order_${escapeHtml(order.orderNo || "invoice")}</title>
<style>
  @page { margin: 16px; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #222; background: #fff; }
  .invoice { max-width: 760px; margin: 0 auto; border: 3px solid #c8e6c9; border-radius: 8px; overflow: hidden; }
  .header { background: #1b5e20; padding: 16px 22px; display: flex; align-items: center; gap: 14px; }
  .header img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
  .header .title { color: #fff; font-size: 20px; font-weight: 800; }
  .header .sub { color: #a5d6a7; font-size: 12px; margin-top: 2px; }
  .meta-bar { background: #e8f5e9; height: 5px; }
  .meta { display: flex; justify-content: space-between; padding: 16px 22px 14px; border-bottom: 1.5px solid #c8e6c9; }
  .meta .order-no { color: #388e3c; font-weight: 700; font-size: 13px; }
  .meta .date { color: #555; font-size: 13px; margin-top: 3px; }
  .meta .cust-name { color: #1b5e20; font-weight: 700; font-size: 16px; margin-top: 10px; }
  .meta .cust-phone { color: #333; font-size: 13px; margin-top: 2px; }
  .meta .right { text-align: right; }
  .meta .courier { color: #1b5e20; font-weight: 700; font-size: 13px; }
  .meta .address { color: #555; font-size: 13px; margin-top: 10px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #e8f5e9; }
  thead th { padding: 9px 6px; text-align: left; color: #1b5e20; font-size: 12px; font-weight: 700; }
  thead th.r { text-align: right; }
  .total-row { display: flex; justify-content: space-between; align-items: center; background: #e8f5e9; margin: 14px 22px 0; padding: 12px 16px; border-radius: 6px; }
  .total-row .label { color: #1b5e20; font-weight: 700; font-size: 14px; }
  .total-row .value { color: #1b5e20; font-weight: 800; font-size: 19px; }
  .sig { display: flex; justify-content: flex-end; padding: 22px; border-top: 1px solid #c8e6c9; margin-top: 18px; }
  .sig img.sig-img { display: block; max-width: 80px; max-height: 32px; object-fit: contain; margin-left: auto; }
  .sig .label { color: #888; font-size: 11px; text-align: right; margin-top: 4px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
  }
</style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <img src="${LOGO_B64}" />
      <div>
        <div class="title">Chitra Laboratories (Unani)</div>
        <div class="sub">Order Invoice</div>
      </div>
    </div>
    <div class="meta-bar"></div>
    <div class="meta">
      <div>
        <div class="order-no">Order No: ${escapeHtml(order.orderNo || "—")}</div>
        <div class="date">Date: ${escapeHtml(formatDate(order.date))}</div>
        <div class="cust-name">${escapeHtml(order.customerName || "—")}</div>
        <div class="cust-phone">${escapeHtml(order.customerPhone || "")}</div>
      </div>
      <div class="right">
        <div class="courier">${escapeHtml(order.courier || "")}</div>
        <div class="address">${escapeHtml(order.customerAddress || "")}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Product Name</th>
          <th class="r">Price (৳)</th>
          <th class="r">Qty</th>
          <th class="r">Total (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="total-row">
      <span class="label">Grand Total</span>
      <span class="value">৳ ${total.toFixed(2)}</span>
    </div>
    ${noteHtml}
    <div class="sig">
      <div>
        <img class="sig-img" src="${SIGNATURE_B64}" alt="Signature" />
        <div class="label">Order Created By</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(cleanup, 1000);
    }, 200);
  };
}

export function printPendingReport(orders) {
  const pending = orders.filter((o) => o.courierSent && !o.paymentReceived);
  let totalAmount = 0;

  const rows = pending.map((o, i) => {
    const amount = calcTotal(o.products);
    totalAmount += amount;
    const date = formatDate(o.date);
    const collected = o.productCollected ? "Yes" : "No";

    return `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fdf9"}">
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;">${i + 1}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;">${date}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;">${escapeHtml(o.customerName)}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;">${escapeHtml(o.customerAddress || "")}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;text-align:right;">৳${amount.toFixed(0)}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">Yes</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">${collected}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;text-align:center;">No</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Pending_Orders_Report</title>
<style>
  @page { margin: 20px; size: landscape; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #222; background: #fff; }
  .report-container { max-width: 1000px; margin: 0 auto; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1b5e20; padding-bottom: 15px; margin-bottom: 20px; }
  .header-left { display: flex; align-items: center; gap: 15px; }
  .header img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #1b5e20; }
  .title { color: #1b5e20; font-size: 24px; font-weight: 800; }
  .sub { color: #555; font-size: 14px; margin-top: 4px; }
  .report-date { font-size: 13px; color: #555; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #1b5e20; color: #fff; }
  thead th { padding: 10px 6px; text-align: left; font-size: 12px; font-weight: 700; border: 1px solid #1b5e20; }
  thead th.c { text-align: center; }
  thead th.r { text-align: right; }
  td { border-left: 1px solid #eee; border-right: 1px solid #eee; }
  .summary { display: flex; justify-content: flex-end; align-items: center; background: #e8f5e9; padding: 12px 20px; border-radius: 6px; border: 1px solid #c8e6c9; }
  .summary .label { color: #1b5e20; font-weight: 700; font-size: 15px; margin-right: 15px; }
  .summary .value { color: #1b5e20; font-weight: 800; font-size: 20px; }
  .sig-container { margin-top: 50px; display: flex; justify-content: flex-end; }
  .sig-box { text-align: center; width: 200px; }
  .sig-line { border-bottom: 1px solid #222; margin-bottom: 5px; height: 40px; position: relative; }
  .sig-img { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); max-width: 120px; max-height: 40px; object-fit: contain; }
  .sig-label { font-size: 13px; font-weight: 700; color: #333; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="header-left">
        <img src="${LOGO_B64}" />
        <div>
          <div class="title">Chitra Laboratories (Unani)</div>
          <div class="sub">Pending Orders Report (Courier Sent, Payment Due)</div>
        </div>
      </div>
      <div class="report-date">
        <strong>Generated On:</strong><br/>
        ${new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Order Date</th>
          <th>Customer Name</th>
          <th>Branch/Area</th>
          <th class="r">Amount</th>
          <th class="c">Courier Sent</th>
          <th class="c">Collected</th>
          <th class="c">Paid</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length > 0 ? rows : '<tr><td colspan="8" style="text-align:center;padding:20px;color:#888;">No pending orders found.</td></tr>'}
      </tbody>
    </table>
    <div class="summary">
      <span class="label">Total Pending Amount:</span>
      <span class="value">৳ ${totalAmount.toFixed(0)}</span>
    </div>
    <div class="sig-container">
      <div class="sig-box">
        <div class="sig-line">
          <img class="sig-img" src="${SIGNATURE_B64}" alt="Signature" />
        </div>
        <div class="sig-label">Authorized Signature</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(cleanup, 1000);
    }, 200);
  };
}

export function downloadPendingReportImage(orders) {
  const pending = orders && orders.length > 0 ? orders : [];
  const canvas = document.createElement("canvas");
  const W = 1200;
  const rowH = 32;
  const headerH = 180;
  const tableHeaderH = 40;
  const footerH = 120;
  const H = headerH + tableHeaderH + Math.max(pending.length, 1) * rowH + 40 + footerH;
  
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  
  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  
  // Header background
  ctx.fillStyle = "#1b5e20";
  ctx.fillRect(0, 0, W, headerH);
  
  // Logo and title
  const img = new Image();
  img.onload = () => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(60, 50, 38, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 22, 12, 76, 76);
    ctx.restore();
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Chitra Laboratories (Unani)", 130, 48);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText("Pending Orders Report", 130, 68);
    ctx.fillStyle = "#c8e6c9";
    ctx.font = "12px Arial";
    const genDate = new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    ctx.fillText("Generated: " + genDate, 130, 90);
    
    ctx.fillStyle = "#e8f5e9";
    ctx.fillRect(0, headerH - 5, W, 5);
    
    // Table header
    const th = headerH + 20;
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 13px Arial";
    const cols = [40, 120, 280, 480, 620, 700, 800, 920];
    ["SL", "Date", "Customer", "Area", "Amount", "Courier", "Collected", "Paid"].forEach((h, i) => {
      if (i >= 4) {
        ctx.textAlign = "right";
        ctx.fillText(h, cols[i + 1], th + 18);
        ctx.textAlign = "left";
      } else {
        ctx.fillText(h, cols[i], th + 18);
      }
    });
    
    // Table rows
    let totalAmount = 0;
    pending.forEach((o, i) => {
      const ry = headerH + tableHeaderH + i * rowH;
      const amount = calcTotal(o.products);
      totalAmount += amount;
      
      ctx.fillStyle = i % 2 === 0 ? "#fff" : "#f9fdf9";
      ctx.fillRect(20, ry, W - 40, rowH);
      
      ctx.fillStyle = "#888";
      ctx.font = "12px Arial";
      ctx.fillText(String(i + 1), cols[0], ry + 20);
      
      ctx.fillStyle = "#222";
      ctx.font = "12px Arial";
      ctx.fillText(formatDate(o.date), cols[1], ry + 20);
      ctx.fillText(o.customerName.substring(0, 20), cols[2], ry + 20);
      ctx.fillText((o.customerAddress || "").substring(0, 15), cols[3], ry + 20);
      
      ctx.textAlign = "right";
      ctx.fillStyle = "#1b5e20";
      ctx.font = "bold 12px Arial";
      ctx.fillText("৳" + amount.toFixed(0), cols[5], ry + 20);
      
      ctx.fillStyle = "#388e3c";
      ctx.font = "12px Arial";
      ctx.fillText("Yes", cols[6], ry + 20);
      ctx.fillText(o.productCollected ? "Yes" : "No", cols[7], ry + 20);
      ctx.fillText("—", cols[8] || W - 60, ry + 20);
      
      ctx.textAlign = "left";
    });
    
    // No data message
    if (pending.length === 0) {
      ctx.fillStyle = "#aaa";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No pending orders found", W / 2, headerH + tableHeaderH + 50);
      ctx.textAlign = "left";
    }
    
    // Total section
    const totalY = headerH + tableHeaderH + Math.max(pending.length, 1) * rowH + 20;
    ctx.fillStyle = "#e8f5e9";
    ctx.fillRect(20, totalY, W - 40, 40);
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Total Pending Amount", 40, totalY + 26);
    ctx.textAlign = "right";
    ctx.font = "bold 18px Arial";
    ctx.fillText("৳ " + totalAmount.toFixed(2), W - 40, totalY + 26);
    ctx.textAlign = "left";
    
    // Signature area
    const sigY = totalY + 60;
    ctx.strokeStyle = "#c8e6c9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, sigY);
    ctx.lineTo(W - 40, sigY);
    ctx.stroke();
    
    const sigImg = new Image();
    sigImg.onload = () => {
      const maxW = 100, maxH = 40;
      const ratio = Math.min(maxW / sigImg.width, maxH / sigImg.height);
      const sW = sigImg.width * ratio, sH = sigImg.height * ratio;
      ctx.drawImage(sigImg, W - 40 - sW, sigY + 10, sW, sH);
      
      ctx.fillStyle = "#888";
      ctx.font = "11px Arial";
      ctx.textAlign = "right";
      ctx.fillText("Authorized Signature", W - 40, sigY + sH + 22);
      ctx.textAlign = "left";
      
      // Border
      ctx.strokeStyle = "#c8e6c9";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      
      // Download
      const link = document.createElement("a");
      link.download = "Pending_Report_" + new Date().toISOString().split("T")[0] + ".jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
    sigImg.src = SIGNATURE_B64;
  };
  img.src = LOGO_B64;
}
