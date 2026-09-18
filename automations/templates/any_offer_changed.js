const CONVERGENCE_THRESHOLD = 0.01; // 1% - stop optimizing when boundaries this close
const PROPAGATION_MS = 40 * 1000; // Amazon can keep reporting our old price this long after accepting a new one

function handle(event, context) {
  const listing = context.listing;
  const notification = event.Payload?.AnyOfferChangedNotification;
  const summary = notification?.Summary;
  const sellerId = notification?.SellerId;

  if (!listing.floor || !listing.ceiling) return context;

  // Find my offer
  const offers = notification?.Offers || [];
  const myOffer = offers.find((o) => o.SellerId === sellerId);

  // Can't act without our own offer in the notification
  if (!myOffer) return context;

  // Amazon still reports the price our last accepted write replaced: wait for it rather than react to it
  const propagating = propagatingPrice(listing);
  if (propagating !== null && propagating !== myOffer.ListingPrice?.Amount) {
    return context;
  }

  // Only learn when we're featured (Buy Box eligible)
  if (!myOffer.IsFeaturedMerchant) {
    return context;
  }

  const shipping = myOffer.Shipping?.Amount ?? listing.shipping;
  const myLanded = landedPrice(myOffer);
  const winning = Boolean(myOffer.IsBuyBoxWinner);
  const buyBox = buyBoxPrice(summary, listing.condition);

  // Buy box suppressed - no winner exists
  if (!winning && !buyBox) {
    // Explore toward floor to try becoming buy-box eligible
    const midpoint = (listing.floor + (myLanded - shipping)) / 2;
    queueReprice(context, round(midpoint), myOffer);
    return context;
  }

  // Every featured offer competes for the same Buy Box, whatever its fulfillment channel.
  // When winning, learn against the nearest one. When losing, against the Buy Box price.
  const buyBoxLanded = buyBox && landedPrice(buyBox);
  let compLanded = buyBoxLanded;
  if (winning) {
    const nearest = offers
      .filter((o) => o.SellerId !== sellerId && o.IsFeaturedMerchant)
      .map(landedPrice)
      .sort((a, b) => Math.abs(a - myLanded) - Math.abs(b - myLanded))[0];

    // Note: When winning with no competitor, we stay put. Jumping to ceiling would
    // cause ping-pong with suppression path. Not worth the complexity to track.
    if (nearest === undefined) return context;
    compLanded = nearest;
  }

  // Cap ceiling with competitive threshold if available
  const threshold = summary?.CompetitivePriceThreshold?.Amount;
  const ceiling = threshold
    ? Math.min(listing.ceiling, threshold)
    : listing.ceiling;
  // Pricing above a Buy Box another seller holds can't win it back
  const maxLanded = winning
    ? ceiling + shipping
    : Math.min(ceiling + shipping, buyBoxLanded);

  // Learn and suggest price. Each move goes straight to its target; once bounds converge, the price Amazon
  // echoes back is the one we'd send, so nothing is sent.
  const delta = learnBoundaries(
    context,
    myOffer,
    myLanded,
    compLanded,
    winning,
  );
  const price = clamp(
    compLanded * (1 + delta) - shipping,
    listing.floor,
    maxLanded - shipping,
  );
  queueReprice(context, round(price), myOffer);

  return context;
}

// Returns the delta to price at, relative to the competitor. Our current delta holds the price.
function learnBoundaries(context, myOffer, myLanded, compLanded, winning) {
  const { asin, condition } = context.listing;
  const key = boundaryKey(asin, condition, myOffer);
  const bounds = context.store.get(key) || { w: null, l: null, ts: null };

  // Reset stale boundaries (24h TTL handled by Redis, but also check here)
  const now = Date.now();
  if (bounds.ts && now - bounds.ts > 24 * 60 * 60 * 1000) {
    bounds.w = null;
    bounds.l = null;
  }

  // Percentage delta: negative means we're cheaper
  const delta = (myLanded - compLanded) / compLanded;

  // Update boundaries. A win above the losing boundary keeps it: that loss is our only evidence of where headroom ends.
  if (winning) {
    if (bounds.w === null || delta > bounds.w) {
      bounds.w = delta;
    }
  } else {
    if (bounds.l === null || delta < bounds.l) {
      bounds.l = delta;
    }
    // Invalidate winning boundary if we lost at a lower delta
    if (bounds.w !== null && delta <= bounds.w) {
      bounds.w = null;
    }
  }

  bounds.ts = now;
  context.store.set(key, bounds);

  if (winning) return suggestWhenWinning(delta, bounds);
  return suggestWhenLosing(delta, bounds);
}

function suggestWhenWinning(currentDelta, bounds) {
  // No losing boundary - explore upward until a loss sets one
  if (bounds.l === null) return exploreHigher(currentDelta);
  // Anti-jitter: boundaries converged (or a win came above the loss) - stay put
  if (bounds.l - bounds.w < CONVERGENCE_THRESHOLD) return currentDelta;
  // Bisect between current and losing boundary
  return (currentDelta + bounds.l) / 2;
}

function suggestWhenLosing(currentDelta, bounds) {
  if (bounds.w === null) {
    // No winning boundary - explore downward
    return exploreLower(currentDelta);
  }
  // Bisect between current and winning boundary
  return (currentDelta + bounds.w) / 2;
}

// Explore higher prices (increase percentage delta)
function exploreHigher(delta) {
  if (delta < -0.02) {
    // We're more than 2% below - halve the gap
    return delta / 2;
  } else if (delta < 0) {
    // We're slightly below - try matching
    return 0;
  } else if (delta < 0.01) {
    // We're at or slightly above - try 1% above
    return 0.01;
  } else {
    // Double our premium
    return delta * 2;
  }
}

// Explore lower prices (decrease percentage delta)
function exploreLower(delta) {
  if (delta > 0.02) {
    // We're more than 2% above - halve it
    return delta / 2;
  } else if (delta > 0) {
    // We're slightly above - try matching
    return 0;
  } else if (delta > -0.01) {
    // We're at or slightly below - try 1% below
    return -0.01;
  } else {
    // Double our discount
    return delta * 2;
  }
}

function boundaryKey(asin, condition, myOffer) {
  const channel = myOffer.IsFulfilledByAmazon ? "Amazon" : "Merchant";
  return `bounds:${asin}:${condition}:${channel}`;
}

// Note: Key uses condition but not subcondition. The algorithm learns empirically
// what delta works in each channel - subcondition advantage is captured
// in win/lose outcomes.

// The Buy Box for our condition, or null when Amazon reports none. Amazon capitalizes the condition ("New").
function buyBoxPrice(summary, condition) {
  const prices = summary?.BuyBoxPrices || [];
  return (
    prices.find(
      (p) => p.Condition?.toLowerCase() === condition?.toLowerCase(),
    ) || null
  );
}

// Listing price plus shipping, the same sum for an offer and the Buy Box
function landedPrice(offer) {
  return (offer.ListingPrice?.Amount || 0) + (offer.Shipping?.Amount || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function queueReprice(context, price, myOffer) {
  // Amazon already shows this price, or a queued request already asks for it
  const queued = context.listing.mutations
    .filter((m) => m.status === "queued")
    .map(requestedPrice);
  if (price === myOffer.ListingPrice?.Amount || queued.includes(price)) return;

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

// The price of our latest submitted request while Amazon may still report the one before it:
// accepted under PROPAGATION_MS ago. Null otherwise.
function propagatingPrice(listing) {
  const latest = listing.mutations.find((m) => m.status === "submitted");
  if (!latest?.accepted) return null;
  const age = Date.now() - Date.parse(latest.submittedAt);
  return age < PROPAGATION_MS ? requestedPrice(latest) : null;
}

// The B2C price a request set, or null when it set none
function requestedPrice(mutation) {
  const offer = mutation.payload?.patches?.[0]?.value?.[0];
  if (!offer || (offer.audience ?? "ALL") !== "ALL") return null;
  return offer.our_price?.[0]?.schedule?.[0]?.value_with_tax ?? null;
}
