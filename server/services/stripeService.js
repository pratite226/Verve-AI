const Stripe = require("stripe");

let stripeClient = null;
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — add your Stripe test-mode secret key to .env to use billing."
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

// Creates a Stripe Checkout Session in subscription mode for the given plan. The session's
// success/cancel URLs send the user back to the client; the actual subscription record is
// only created once Stripe confirms payment via the webhook (checkout.session.completed) —
// never on the client-side redirect, which can be spoofed or interrupted.
const createCheckoutSession = async ({ mongoUserId, planId, planName, priceCents, interval, email }) => {
  const stripe = getStripe();
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: mongoUserId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Verve ${planName}` },
          unit_amount: priceCents,
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    metadata: { mongoUserId, planId: String(planId) },
    success_url: `${clientUrl}/billing?checkout=success`,
    cancel_url: `${clientUrl}/billing?checkout=cancelled`,
  });
};

// Verifies the webhook signature (proves the request actually came from Stripe, not a
// forged POST to this endpoint) and returns the parsed event.
const verifyWebhookEvent = (rawBody, signature) => {
  const stripe = getStripe();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set — required to verify webhook signatures.");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

module.exports = { createCheckoutSession, verifyWebhookEvent };
