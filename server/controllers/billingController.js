const prisma = require("../config/prisma");
const { createCheckoutSession, verifyWebhookEvent } = require("../services/stripeService");
const { emitToUser } = require("../services/socketService");

// @route GET /api/billing/plans
const getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { priceCents: "asc" } });
    return res.status(200).json({ success: true, plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/billing/invoices?status=paid&sort=issuedAt:desc
// Real SQL filtering + ordering via Prisma's query builder (WHERE + ORDER BY), scoped to
// the caller's own subscription(s) only.
const getInvoices = async (req, res) => {
  try {
    const { status, sort } = req.query;
    const validStatuses = ["open", "paid", "void"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [sortField, sortDir] = typeof sort === "string" ? sort.split(":") : [];
    const orderBy =
      sortField === "issuedAt" || sortField === "amountCents"
        ? { [sortField]: sortDir === "asc" ? "asc" : "desc" }
        : { issuedAt: "desc" };

    const invoices = await prisma.invoice.findMany({
      where: {
        subscription: { mongoUserId: String(req.user._id) },
        ...(status ? { status } : {}),
      },
      orderBy,
      include: { subscription: { include: { plan: true } } },
    });

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/billing/summary
// Two GROUP BY styles over the same data: Prisma's groupBy() for a per-status rollup, and
// a raw parameterized SQL query (JOIN + WHERE + GROUP BY + ORDER BY) for a per-month rollup
// that Prisma's query builder can't express directly (no date-trunc groupBy support).
const getSummary = async (req, res) => {
  try {
    const mongoUserId = String(req.user._id);

    const byStatus = await prisma.invoice.groupBy({
      by: ["status"],
      where: { subscription: { mongoUserId } },
      _sum: { amountCents: true },
      _count: true,
    });

    const byMonth = await prisma.$queryRaw`
      SELECT date_trunc('month', i."issuedAt") AS month,
             SUM(i."amountCents")::int AS total_cents,
             COUNT(*)::int AS invoice_count
      FROM "Invoice" i
      JOIN "Subscription" s ON s.id = i."subscriptionId"
      WHERE s."mongoUserId" = ${mongoUserId}
      GROUP BY month
      ORDER BY month DESC
    `;

    return res.status(200).json({ success: true, byStatus, byMonth });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Not an HTTP route — called directly by the Stripe webhook handler (Phase 5) once a
// checkout/invoice event confirms payment. Wraps the subscription upsert and invoice
// creation in one transaction so a partial write (subscription updated, invoice not
// created, or vice versa) can never happen if the process crashes mid-way.
const subscribeUser = async ({ mongoUserId, planId, amountCents, stripeIds = {} }) => {
  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { stripeSubscriptionId: stripeIds.subscriptionId || `pending-${mongoUserId}-${planId}` },
      update: {
        status: "active",
        currentPeriodEnd: stripeIds.currentPeriodEnd,
        stripeCustomerId: stripeIds.customerId,
      },
      create: {
        mongoUserId,
        planId,
        status: "active",
        stripeCustomerId: stripeIds.customerId,
        stripeSubscriptionId: stripeIds.subscriptionId,
        currentPeriodEnd: stripeIds.currentPeriodEnd,
      },
    });

    const invoice = await tx.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amountCents,
        status: "paid",
        stripeInvoiceId: stripeIds.invoiceId,
      },
    });

    return { subscription, invoice };
  });
};

// @route POST /api/billing/checkout
// Body: { "planName": "Pro" }
const createCheckout = async (req, res) => {
  try {
    const { planName } = req.body;
    if (!planName) {
      return res.status(400).json({ success: false, message: "planName is required" });
    }

    const plan = await prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const session = await createCheckoutSession({
      mongoUserId: String(req.user._id),
      planId: plan.id,
      planName: plan.name,
      priceCents: plan.priceCents,
      interval: plan.interval,
      email: req.user.email,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/billing/webhook
// Mounted with express.raw() (not express.json()) in server.js — Stripe's signature check
// needs the exact raw request bytes, not a re-serialized parsed body.
const handleWebhook = async (req, res) => {
  let event;
  try {
    event = verifyWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (error) {
    return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${error.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { subscription } = await subscribeUser({
        mongoUserId: session.metadata.mongoUserId,
        planId: Number(session.metadata.planId),
        amountCents: session.amount_total,
        stripeIds: {
          customerId: session.customer,
          subscriptionId: session.subscription,
          invoiceId: session.invoice,
        },
      });
      emitToUser(session.metadata.mongoUserId, "billing:updated", { status: subscription.status });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPlans, getInvoices, getSummary, subscribeUser, createCheckout, handleWebhook };
