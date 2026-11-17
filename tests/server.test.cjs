"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp, validAmount } = require("../server");

test("validAmount accepts whole cents within bounds", () => {
  assert.equal(validAmount(50), true);
  assert.equal(validAmount(500000), true);
  for (const v of [0, 1, 20.2, -100, 500001, NaN, "500"]) assert.equal(validAmount(v), false);
});

async function withServer(app, action) {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const port = server.address().port;
    return await action(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("invalid donation rejected without reaching Stripe", async () => {
  let called = false;
  const client = { checkout: { sessions: { create: async () => { called = true; } } } };
  await withServer(createApp({ stripeClient: client, baseUrl: "http://127.0.0.1:3000" }), async (base) => {
    const response = await fetch(base + "/create-payment-intent", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1.5 }),
    });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  });
});

test("returns a hosted Stripe test Checkout URL from server", async () => {
  let sentAmount;
  const client = { checkout: { sessions: { create: async (payload) => {
    sentAmount = payload.line_items[0].price_data.unit_amount;
    return { url: "https://checkout.stripe.com/c/pay/cs_test_mock" };
  } } } };
  await withServer(createApp({ stripeClient: client, baseUrl: "http://127.0.0.1:3000" }), async (base) => {
    const response = await fetch(base + "/create-payment-intent", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 500 }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).url, "https://checkout.stripe.com/c/pay/cs_test_mock");
    assert.equal(sentAmount, 500);
  });
});

test("serves the donation form without requiring Stripe credentials", async () => {
  await withServer(createApp({ stripeClient: null, baseUrl: "http://127.0.0.1:3000" }), async (base) => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /donateButton/);
  });
});
