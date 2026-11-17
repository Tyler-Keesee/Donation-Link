"use strict";
require("dotenv").config();
const express = require("express");
const path = require("node:path");

function validAmount(amount) {
  return Number.isSafeInteger(amount) && amount >= 50 && amount <= 500000;
}

function createApp({ stripeClient, baseUrl }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "8kb" }));
  const siteOrigin = new URL(baseUrl).origin;
  app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
  app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
  app.get("/main.js", (req, res) => res.type("text/javascript").sendFile(path.join(__dirname, "main.js")));

  app.post("/create-payment-intent", async (req, res) => {
    const amount = req.body && req.body.amount;
    if (!validAmount(amount)) {
      return res.status(400).json({ error: "Amount must be between $0.50 and $5000.00, in whole cents." });
    }
    if (!stripeClient) {
      return res.status(503).json({ error: "Stripe is not configured on this server." });
    }
    try {
      const session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Donation" },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: `${siteOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteOrigin}/cancel`,
      });
      if (!session.url) throw new Error("Stripe did not return a Checkout URL");
      return res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Checkout session creation failed:", error.message);
      return res.status(502).json({ error: "Could not start secure checkout. Try again later." });
    }
  });
  app.get("/success", (req, res) => {
    res.type("text/plain").send("Returned from checkout. Confirm the final payment status in Stripe. Returning here does not itself verify payment.");
  });
  app.get("/cancel", (req, res) => res.redirect("/"));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) {
    console.error("Local development requires STRIPE_SECRET_KEY=sk_test_... in .env. Live keys are intentionally disabled by this starter.");
    process.exitCode = 1;
  } else {
    const Stripe = require("stripe");
    const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;
    const app = createApp({ stripeClient: new Stripe(key), baseUrl });
    app.listen(port, "127.0.0.1", () => console.log(`Local Stripe TEST mode demo at http://127.0.0.1:${port}`));
  }
}

module.exports = { createApp, validAmount };
