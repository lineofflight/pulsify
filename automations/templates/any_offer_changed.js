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

  // Cap ceiling with competitive threshold if available
  const threshold = summary?.CompetitivePriceThreshold?.Amount;
  const ceiling = threshold
    ? Math.min(listing.ceiling, threshold)
    : listing.ceiling;

  // Buy box suppressed - no winner exists. Head back for the price we last won at.
  const myPrice = myLanded - shipping;
  if (!winning && !buyBox) {
    const { held } = buyBoxMemory(context, myPrice, false);
    const price = clamp(
      recoveryPrice(held, myPrice, listing.floor),
      listing.floor,
      ceiling,
    );
    queueReprice(context, round(price), myOffer);
    return context;
  }

  // Every featured offer competes for the same Buy Box, whatever its fulfillment channel.
  // When winning, learn against the nearest one. When losing, against the Buy Box price.
  const buyBoxLanded = buyBox && landedPrice(buyBox);
  let compLanded = buyBoxLanded;
  // A price Amazon suppressed us at caps a win, however high the competitor sits
  let suppressionCap = Infinity;
  if (winning) {
    const { suppressed } = buyBoxMemory(context, myPrice, true);
    const nearest = offers
      .filter((o) => o.SellerId !== sellerId && o.IsFeaturedMerchant)
      .map(landedPrice)
      .sort((a, b) => Math.abs(a - myLanded) - Math.abs(b - myLanded))[0];

    // Note: When winning with no competitor, we stay put. Searching for a higher price needs the Buy Box status
    // to settle between moves, and nothing wakes this code up to wait for it.
    if (nearest === undefined) return context;
    compLanded = nearest;
    suppressionCap = capUnder(suppressed, myPrice);
  }

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
    Math.min(maxLanded - shipping, suppressionCap),
  );
  queueReprice(context, round(price), myOffer);

  return context;
}

// What the Buy Box status last told us about this offer: the price we had when it last turned to winning, and the
// price we had when it last turned to suppressed.
function buyBoxMemory(context, price, winning) {
  const { asin, condition } = context.listing;
  const key = `buybox:${context.marketplace?.marketplaceId}:${asin}:${condition}`;
  const memory = context.store.get(key) || {};

  // Amazon can report the status from before our last write for several writes after it, so only a change of status
  // is evidence. Writing nothing else lets the record expire with the store, 7 days after the last change.
  if (memory.winning !== winning) {
    memory.winning = winning;
    if (winning) memory.held = price;
    else memory.suppressed = price;
    context.store.set(key, memory);
  }

  return memory;
}

// The next price while the Buy Box is suppressed
function recoveryPrice(held, price, floor) {
  // Never won: explore toward the floor
  if (held === undefined) return (floor + price) / 2;
  // Still suppressed at or under a price we won at: the status is stale, or the market moved. Step under that
  // price, doubling the gap each time, rather than cut toward the floor.
  if (held >= price) {
    return held - Math.max(held * CONVERGENCE_THRESHOLD, 2 * (held - price));
  }
  // Close enough to the price we won at: return to it
  if ((price - held) / held < CONVERGENCE_THRESHOLD) return held;
  return (held + price) / 2;
}

// The highest a winning price may go under one Amazon suppressed us at: halfway there, until within reach of it
function capUnder(suppressed, price) {
  if (!(suppressed > price)) return Infinity;
  if ((suppressed - price) / price < CONVERGENCE_THRESHOLD) return price;
  return (price + suppressed) / 2;
}

// Returns the delta to price at, relative to the competitor. Our current delta holds the price.
function learnBoundaries(context, myOffer, myLanded, compLanded, winning) {
  const { asin, condition } = context.listing;
  const key = boundaryKey(asin, condition, myOffer);
  const bounds = context.store.get(key) || { w: null, l: null, ts: null };

  // Reset stale boundaries: the store keeps them for 7 days
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
  // Amazon already shows this price, or a pending request already asks for it
  const queued = context.listing.mutations
    .filter((m) => ["queued", "submitting", "uncertain"].includes(m.status))
    .map(requestedPrice);
  if (price === myOffer.ListingPrice?.Amount || queued.includes(price)) return;

  context.mutations.push({
    target: context.listing,
    action: "update",
    payload: {
      productType: "PRODUCT",
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
