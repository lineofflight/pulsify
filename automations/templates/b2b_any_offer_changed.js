const PROPAGATION_MS = 40 * 1000; // Amazon can keep reporting our old price this long after accepting a new one

function handle(event, context) {
  const listing = context.listing;
  const notification = event.Payload?.B2BAnyOfferChangedNotification;

  // Use B2C bounds (Amazon doesn't provide B2B-specific min/max)
  if (!listing.floor || !listing.ceiling) return context;

  // Find lowest B2B price for matching fulfillment channel
  const lowestPriceEntry = notification?.Summary?.LowestPrices?.find(
    (p) => p.FulfillmentChannel === listing.fulfillmentChannel,
  );
  const lowestB2bPrice = lowestPriceEntry?.ListingPrice?.Amount;

  if (!lowestB2bPrice) return context;

  // Match lowest B2B price, clamped to B2C bounds
  const price = Math.max(
    listing.floor,
    Math.min(lowestB2bPrice, listing.ceiling),
  );

  // Amazon already shows this price, or a request for it has not landed yet
  const myOffer = notification.Offers?.find(
    (o) => o.SellerId === notification.SellerId,
  );
  const current = myOffer?.ListingPrice?.Amount ?? listing.b2bPrice;
  if (price === current || pendingB2bPrices(listing).includes(price)) {
    return context;
  }

  queueB2bReprice(context, price);

  return context;
}

function queueB2bReprice(context, price) {
  context.mutations.push({
    target: context.listing,
    patches: [
      {
        op: "replace",
        path: "/attributes/purchasable_offer",
        value: [
          {
            audience: "B2B",
            our_price: [{ schedule: [{ value_with_tax: price }] }],
          },
        ],
      },
    ],
  });
}

// B2B prices our requests set that Amazon may not show yet: queued, or accepted under PROPAGATION_MS ago
function pendingB2bPrices(listing) {
  return listing.mutations
    .filter(
      (m) =>
        m.status === "queued" ||
        (m.accepted && Date.now() - Date.parse(m.submittedAt) < PROPAGATION_MS),
    )
    .map((m) => m.payload?.patches?.[0]?.value?.[0])
    .filter((offer) => offer?.audience === "B2B")
    .map((offer) => offer.our_price?.[0]?.schedule?.[0]?.value_with_tax);
}
