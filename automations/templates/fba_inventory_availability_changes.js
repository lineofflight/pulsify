// FBA inventory velocity — starter example.
//
// The GET_FBA_INVENTORY_PLANNING_DATA report is synced into
// context.listing.fba.planning (raw Amazon fields, camelCased). This example
// reads sell-through and flags slow movers. It does nothing by default — edit
// the threshold, swap in other planning fields, or uncomment the price nudge to
// act. Sell-through (units shipped 90d / average inventory 90d) is Amazon's most
// heavily weighted IPI input: 2.0–7.0 is healthy, below 2.0 needs work.

const SELL_THROUGH_FLOOR = 2.0;

function handle(event, context) {
  const listing = context.listing;
  const planning = listing.fba?.planning;

  // No planning data yet (report not synced for this SKU) — nothing to do.
  if (!planning) return context;

  // Report values are strings; coerce and guard against blanks/non-numbers.
  const sellThrough = Number(planning.sellThrough);
  if (!Number.isFinite(sellThrough)) return context;

  // Other useful planning signals available on the same hash, e.g.:
  //   Number(planning.unitsShippedT90)   // units shipped, trailing 90 days
  //   Number(planning.weeksOfCoverT90)   // weeks of cover at current velocity
  //   Number(planning.available)         // sellable units on hand
  // Any column the report carries is here — it stores the whole raw row.

  const isSlowMover = sellThrough < SELL_THROUGH_FLOOR;
  if (!isSlowMover) return context;

  // Slow mover: this is where you decide what to do. By default we do nothing.
  //
  // Option A — nudge price down to lift sell-through (opt in by uncommenting).
  // Respects the configured floor so it never undercuts your minimum.
  //
  //   if (listing.floor && listing.price > listing.floor) {
  //     const target = Math.max(listing.floor, round(listing.price * 0.95));
  //     context.mutations.push({
  //       target: context.listing,
  //       patches: [{
  //         op: "replace",
  //         path: "/attributes/purchasable_offer",
  //         value: [{ our_price: [{ schedule: [{ value_with_tax: target }] }] }],
  //       }],
  //     });
  //   }
  //
  // Option B — record the flag for your own reporting via context.store, or
  // branch on weeks-of-cover, excess units, inventory age, etc.

  return context;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
