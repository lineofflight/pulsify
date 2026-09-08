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
