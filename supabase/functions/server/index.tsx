import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Credentials — set in Supabase → Edge Functions → Secrets ─────────────────
// RAZORPAY_KEY_ID     = rzp_live_TIEDxqua3lfAOc
// RAZORPAY_KEY_SECRET = CkY27uy3bXLoX1A4jBcuLVlz

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/make-server-3ba67fd8/health", (c) => c.json({ status: "ok" }));

// ── POST /create-order ────────────────────────────────────────────────────────
// Saves customer + order to DB, returns internal order ID (no Razorpay).
app.post("/make-server-3ba67fd8/create-order", async (c) => {
  try {
    const supabaseUrl    = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return c.json({ success: false, message: "Supabase not configured." }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const body = await c.req.json();
    const { customerName, email, phone, companyName, selectedServices, subtotal, gst, grandTotal } = body;

    if (!customerName || !email || !phone) {
      return c.json({ success: false, message: "Missing required fields." }, 400);
    }

    const emailNorm = email.trim().toLowerCase();

    const { data: custRows, error: custErr } = await supabase
      .from("customers")
      .upsert({ full_name: customerName, email: emailNorm, phone, company_name: companyName ?? null },
               { onConflict: "email" })
      .select("id").limit(1);

    if (custErr) return c.json({ success: false, message: "Failed to save customer." }, 500);
    const customerId = custRows?.[0]?.id;

    const recalcSubtotal = Number(subtotal) || 0;
    const recalcGst      = Math.round(recalcSubtotal * 0.18 * 100) / 100;
    const recalcTotal    = Math.round((recalcSubtotal + recalcGst) * 100) / 100;

    const { data: orderRows, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        selected_services: selectedServices,
        subtotal: recalcSubtotal,
        gst_amount: recalcGst,
        total_amount: recalcTotal,
        status: "pending_payment",
      })
      .select("id").limit(1);

    if (orderErr) return c.json({ success: false, message: "Failed to create order." }, 500);

    return c.json({ success: true, orderId: orderRows?.[0]?.id, customerId, total: recalcTotal });
  } catch (err) {
    console.error("create-order error:", err);
    return c.json({ success: false, message: "Internal server error." }, 500);
  }
});

// ── POST /create-razorpay-order ───────────────────────────────────────────────
// Creates a Razorpay order. Secret Key never leaves the server.
app.post("/make-server-3ba67fd8/create-razorpay-order", async (c) => {
  try {
    const keyId     = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return c.json({ success: false, message: "Razorpay credentials not configured." }, 500);
    }

    const body = await c.req.json();
    const { customerName, email, phone, grandTotal, selectedServices } = body;
    if (!customerName || !email || !phone || !grandTotal || grandTotal <= 0) {
      return c.json({ success: false, message: "Missing required fields." }, 400);
    }

    const amountInPaise = Math.round(grandTotal * 100);
    const receipt       = `pyg_${Date.now()}`;
    const credentials   = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${credentials}` },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: { customer_name: customerName, email, phone, services: (selectedServices ?? []).join(", ") },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("Razorpay error:", errText);
      return c.json({ success: false, message: "Failed to create payment order." }, 502);
    }

    const order = await rzpRes.json();
    return c.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (err) {
    console.error("create-razorpay-order error:", err);
    return c.json({ success: false, message: "Internal server error." }, 500);
  }
});

// ── POST /verify-razorpay-payment ─────────────────────────────────────────────
// 1. Verifies Razorpay signature using HMAC-SHA256.
// 2. On success: upserts customer + creates order record with payment details.
// 3. Returns { success, verified } or error.
app.post("/make-server-3ba67fd8/verify-razorpay-payment", async (c) => {
  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return c.json({ success: false, verified: false, message: "Server not configured." }, 500);
    }

    const body = await c.req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // customer & order data for DB write
      customerName,
      email,
      phone,
      companyName,
      selectedServices,
      subtotal,
      gst,
      grandTotal,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json({ success: false, verified: false, message: "Missing verification fields." }, 400);
    }

    // ── Signature verification ────────────────────────────────────────────────
    const encoder  = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const computedHex = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const verified = computedHex === razorpay_signature;
    console.log(`Signature verification for ${razorpay_payment_id}: ${verified ? "PASS" : "FAIL"}`);

    if (!verified) {
      return c.json({ success: false, verified: false, message: "Payment signature verification failed." }, 400);
    }

    // ── Write to DB ───────────────────────────────────────────────────────────
    const supabaseUrl    = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && serviceRoleKey && customerName && email) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const emailNorm = email.trim().toLowerCase();

        // Upsert customer
        const { data: custRows } = await supabase
          .from("customers")
          .upsert(
            { full_name: customerName, email: emailNorm, phone: phone ?? "", company_name: companyName ?? null },
            { onConflict: "email" },
          )
          .select("id")
          .limit(1);

        const customerId = custRows?.[0]?.id;

        if (customerId) {
          const total = Number(grandTotal) || 0;
          const sub   = Number(subtotal)   || 0;
          const gstAmt = Math.round(sub * 0.18 * 100) / 100;

          await supabase.from("orders").insert({
            customer_id:                    customerId,
            selected_services:              selectedServices ?? [],
            subtotal:                       sub,
            gst_amount:                     gstAmt,
            total_amount:                   total,
            status:                         "payment_captured",
            payment_provider:               "razorpay",
            payment_provider_order_id:      razorpay_order_id,
            payment_provider_payment_id:    razorpay_payment_id,
            payment_provider_signature:     razorpay_signature,
          });
        }
      } catch (dbErr) {
        // DB write failure must not block returning success to the customer
        console.error("DB write after verification failed:", dbErr);
      }
    }

    return c.json({ success: true, verified: true });
  } catch (err) {
    console.error("verify-razorpay-payment error:", err);
    return c.json({ success: false, verified: false, message: "Internal server error." }, 500);
  }
});

Deno.serve(app.fetch);
