import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
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

// ── Credentials (set these in Supabase → Edge Functions → Secrets) ────────────
// RAZORPAY_KEY_ID     = rzp_live_TIEDxqua3lfAOc
// RAZORPAY_KEY_SECRET = CkY27uy3bXLoX1A4jBcuLVlz

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/make-server-3ba67fd8/health", (c) => c.json({ status: "ok" }));

// ── POST /create-razorpay-order ───────────────────────────────────────────────
// Creates a Razorpay order and returns order_id + amount to the frontend.
// The Secret Key never leaves this function.
app.post("/make-server-3ba67fd8/create-razorpay-order", async (c) => {
  try {
    const keyId     = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return c.json({ success: false, message: "Razorpay credentials not configured on the server." }, 500);
    }

    const body = await c.req.json();
    const { customerName, email, phone, grandTotal, selectedServices } = body;

    if (!customerName || !email || !phone) {
      return c.json({ success: false, message: "Missing required customer fields." }, 400);
    }
    if (!grandTotal || grandTotal <= 0) {
      return c.json({ success: false, message: "Invalid order amount." }, 400);
    }
    if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
      return c.json({ success: false, message: "No services selected." }, 400);
    }

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(grandTotal * 100);
    const receipt       = `pyg_${Date.now()}`;
    const credentials   = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount:   amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          customer_name: customerName,
          email,
          phone,
          services: selectedServices.join(", "),
        },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("Razorpay create order error:", rzpRes.status, errText);
      return c.json({ success: false, message: "Failed to create payment order. Please try again." }, 502);
    }

    const order = await rzpRes.json();
    console.log("Razorpay order created:", order.id);

    return c.json({
      success:  true,
      order_id: order.id,
      amount:   order.amount,   // paise
      currency: order.currency,
      key_id:   keyId,          // public key — safe to return to frontend
    });

  } catch (err) {
    console.error("create-razorpay-order error:", err);
    return c.json({ success: false, message: "Internal server error." }, 500);
  }
});

// ── POST /verify-razorpay-payment ─────────────────────────────────────────────
// Verifies the Razorpay payment signature using HMAC-SHA256.
// Must succeed before the frontend shows the Payment Successful screen.
app.post("/make-server-3ba67fd8/verify-razorpay-payment", async (c) => {
  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return c.json({ success: false, verified: false, message: "Server not configured." }, 500);
    }

    const body = await c.req.json();
    const { order_id, payment_id, signature } = body;

    if (!order_id || !payment_id || !signature) {
      return c.json({ success: false, verified: false, message: "Missing verification fields." }, 400);
    }

    // Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const encoder  = new TextEncoder();
    const keyData  = encoder.encode(keySecret);
    const message  = encoder.encode(`${order_id}|${payment_id}`);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
    const computedHex     = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const verified = computedHex === signature;
    console.log(`Payment verification for ${payment_id}: ${verified ? "PASS" : "FAIL"}`);

    if (!verified) {
      return c.json({ success: false, verified: false, message: "Payment signature verification failed." }, 400);
    }

    return c.json({ success: true, verified: true });

  } catch (err) {
    console.error("verify-razorpay-payment error:", err);
    return c.json({ success: false, verified: false, message: "Internal server error." }, 500);
  }
});

Deno.serve(app.fetch);
