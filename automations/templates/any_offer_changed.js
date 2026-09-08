const CONVERGENCE_THRESHOLD = 0.01; // 1% - stop optimizing when boundaries this close

function handle(event, context) {
  const listing = context.listing;
  const notification = event.Payload?.AnyOfferChangedNotification;
  const summary = notification?.Summary;
  const sellerId = notification?.SellerId;

  if (!listing.floor || !listing.ceiling) return context;

  // Find my offer and the winning competitor
  const offers = notification?.Offers || [];
  const myOffer = offers.find((o) => o.SellerId === sellerId);

  // Can't act without our own offer in the notification
  if (!myOffer) return context;

  // Only learn when we're featured (Buy Box eligible)
  if (!myOffer.IsFeaturedMerchant) {
    return context;
  }

  const shipping = myOffer.Shipping?.Amount ?? listing.shipping;
  const winningCompetitor = offers.find(
    (o) => o.SellerId !== sellerId && o.IsBuyBoxWinner,
  );

  // Buy box suppressed - no winner exists
  if (!winningCompetitor && !myOffer.IsBuyBoxWinner) {
    // Explore toward floor to try becoming buy-box eligible
    const myLanded = landedPrice(myOffer);
    const midpoint = (listing.floor + (myLanded - shipping)) / 2;
    queueReprice(context, round(midpoint));
    return context;
  }

  // Note: Bisection toward floor converges naturally - no state tracking needed.
  // Once we win, IsBuyBoxWinner becomes true and main algorithm takes over.

  // Use winning competitor if we're losing, or nearest featured if we're winning
  const competitor =
    winningCompetitor ||
    offers
      .filter((o) => o.SellerId !== sellerId && o.IsFeaturedMerchant)
      .sort(
        (a, b) =>
          Math.abs(landedPrice(a) - landedPrice(myOffer)) -
          Math.abs(landedPrice(b) - landedPrice(myOffer)),
      )[0];

  if (!competitor) return context;

  // Note: When winning with no competitor, we stay put. Jumping to ceiling would
  // cause ping-pong with suppression path. Not worth the complexity to track.

  // Cap ceiling with competitive threshold if available
  const threshold = summary?.CompetitivePriceThreshold?.Amount;
  const ceiling = threshold
    ? Math.min(listing.ceiling, threshold)
    : listing.ceiling;
  const maxLanded = ceiling + shipping;

  // Learn and suggest price
  const suggestedLanded = learnBoundaries(
    context,
    myOffer,
    competitor,
    maxLanded,
  );

  if (suggestedLanded !== null) {
    const price = clamp(suggestedLanded - shipping, listing.floor, ceiling);
    queueReprice(context, round(price));
  }

  return context;
}

function learnBoundaries(context, myOffer, competitor, maxLanded) {
  const { asin, condition } = context.listing;
  const key = boundaryKey(asin, condition, competitor);
  const bounds = context.store.get(key) || { w: null, l: null, ts: null };

  // Reset stale boundaries (24h TTL handled by Redis, but also check here)
  const now = Date.now();
  if (bounds.ts && now - bounds.ts > 24 * 60 * 60 * 1000) {
    bounds.w = null;
    bounds.l = null;
  }

  const myLanded = landedPrice(myOffer);
  const compLanded = landedPrice(competitor);

  // Percentage delta: negative means we're cheaper
  const delta = (myLanded - compLanded) / compLanded;
  const winning = myOffer.IsBuyBoxWinner;

  // Update boundaries
  if (winning) {
    if (bounds.w === null || delta > bounds.w) {
      bounds.w = delta;
    }
    // Invalidate losing boundary if we won at a higher delta
    if (bounds.l !== null && delta >= bounds.l) {
      bounds.l = null;
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

  // Anti-jitter: stop optimizing when boundaries converged
  if (bounds.w !== null && bounds.l !== null) {
    const gap = bounds.l - bounds.w;
    if (gap < CONVERGENCE_THRESHOLD && winning) {
      // Boundaries converged and we're winning - stay put
      return null;
    }
  }

  // Calculate max delta from threshold
  const maxDelta = (maxLanded - compLanded) / compLanded;

  // Suggest next price
  let suggestedDelta;
  if (winning) {
    suggestedDelta = suggestWhenWinning(delta, bounds, maxDelta);
  } else {
    suggestedDelta = suggestWhenLosing(delta, bounds);
  }

  return round(compLanded * (1 + suggestedDelta));
}

function suggestWhenWinning(currentDelta, bounds, maxDelta) {
  let delta;
  if (bounds.l === null) {
    // No losing boundary - explore upward
    delta = exploreHigher(currentDelta);
  } else {
    // Bisect between current and losing boundary
    delta = (currentDelta + bounds.l) / 2;
  }
  // Don't explore above threshold
  return maxDelta !== null ? Math.min(delta, maxDelta) : delta;
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

function boundaryKey(asin, condition, competitor) {
  return `bounds:${asin}:${condition}:${competitor.SellerId}`;
}

// Note: Key uses condition but not subcondition. The algorithm learns empirically
// what delta works against each competitor - subcondition advantage is captured
// in win/lose outcomes.

function landedPrice(offer) {
  return (offer.ListingPrice?.Amount || 0) + (offer.Shipping?.Amount || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function round(value) {
  return Math.round(value * 100) / 100;
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

