const PROPAGATION_MS = 40 * 1000; // Amazon can keep reporting our old price this long after accepting a new one

function handle(event, context) {
  const listing = context.listing;
  // PRICING_HEALTH payloads are camelCase and nest the summary under `payload`
  // (unlike the PascalCase ANY_OFFER_CHANGED shape).
  const referencePrice = event.payload?.summary?.referencePrice;

  // Skip listings without price bounds
  if (listing.floor == null || listing.ceiling == null) {
    return context;
  }

  // Use competitive threshold as target price (most relevant for Buy Box recovery).
  // Amounts arrive as strings, so coerce to a number; keep null when absent so the
  // fallback below stays intact.
  const rawThreshold = referencePrice?.competitivePriceThreshold?.amount;
  const competitiveThreshold =
    rawThreshold == null ? null : Number(rawThreshold);

  // Fall back to current price if no threshold available
  const targetPrice = competitiveThreshold ?? listing.price;

  // Clamp between floor and ceiling
  const finalPrice = Math.max(
    listing.floor,
    Math.min(targetPrice, listing.ceiling),
  );

  // Amazon already shows this price, or a request for it has not landed yet
  if (
    finalPrice === listing.price ||
    pendingPrices(listing).includes(finalPrice)
  ) {
    return context;
  }

  // Update the listing
  queueReprice(context, finalPrice);

  return context;
}

function queueReprice(context, price) {
  context.mutations.push({
    target: context.listing,
    action: "update",
    payload: {
      productType: context.listing.productType || "PRODUCT",
      patches: [
        {
          op: "replace",
          path: "/attributes/purchasable_offer",
          value: [
            {
              our_price: [{ schedule: [{ value_with_tax: price }] }],
            },
          ],
        },
      ],
    },
  });
}

// B2C prices our requests set that Amazon may not show yet: pending, or accepted under PROPAGATION_MS ago
function pendingPrices(listing) {
  return listing.mutations
    .filter(
      (m) =>
        ["queued", "submitting", "uncertain"].includes(m.status) ||
        (m.accepted && Date.now() - Date.parse(m.submittedAt) < PROPAGATION_MS),
    )
    .map((m) => m.payload?.patches?.[0]?.value?.[0])
    .filter((offer) => offer && (offer.audience ?? "ALL") === "ALL")
    .map((offer) => offer.our_price?.[0]?.schedule?.[0]?.value_with_tax);
}
