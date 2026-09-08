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

  // Update the listing
  queueReprice(context, finalPrice);

  return context;
}

function queueReprice(context, price) {
  context.mutations.push({
    target: context.listing,
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
  });
}
