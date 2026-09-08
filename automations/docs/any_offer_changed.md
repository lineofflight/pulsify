# Any Offer Changed

`ANY_OFFER_CHANGED` · Seller Central · listing context

Changes to the top 20 offers, Buy Box, or external prices for items you sell.

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#any_offer_changed)

## Default template

Tracks price changes against competitors and adjusts offers within your floor and ceiling limits to win the Buy Box.

```js
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
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `EventTime` | string | `2024-11-18T14:31:09.305Z` |
| `NotificationMetadata` | object |  |
| `NotificationMetadata.ApplicationId` | string | `amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000` |
| `NotificationMetadata.NotificationId` | string | `00000000-0000-0000-0000-000000000000` |
| `NotificationMetadata.PublishTime` | string | `2024-11-18T14:31:09.453Z` |
| `NotificationMetadata.SubscriptionId` | string | `00000000-0000-0000-0000-000000000000` |
| `NotificationType` | string | `ANY_OFFER_CHANGED` |
| `NotificationVersion` | string | `1.0` |
| `Payload` | object |  |
| `Payload.AnyOfferChangedNotification` | object |  |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger` | object |  |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger.ASIN` | string | `B00EXAMPLE01` |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger.ItemCondition` | string | `used` |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger.MarketplaceId` | string | `ATVPDKIKX0DER` |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger.OfferChangeType` | string | `Internal` |
| `Payload.AnyOfferChangedNotification.OfferChangeTrigger.TimeOfOfferChange` | string | `2024-11-18T14:31:09.116Z` |
| `Payload.AnyOfferChangedNotification.Offers` | array |  |
| `Payload.AnyOfferChangedNotification.Offers[].IsBuyBoxWinner` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].IsFeaturedMerchant` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].IsFulfilledByAmazon` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].ListingPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Offers[].ListingPrice.Amount` | number | `15.27` |
| `Payload.AnyOfferChangedNotification.Offers[].ListingPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Offers[].PrimeInformation` | object |  |
| `Payload.AnyOfferChangedNotification.Offers[].PrimeInformation.IsOfferNationalPrime` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].PrimeInformation.IsOfferPrime` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].SellerFeedbackRating` | object |  |
| `Payload.AnyOfferChangedNotification.Offers[].SellerFeedbackRating.FeedbackCount` | number | `1250` |
| `Payload.AnyOfferChangedNotification.Offers[].SellerFeedbackRating.SellerPositiveFeedbackRating` | number | `98` |
| `Payload.AnyOfferChangedNotification.Offers[].SellerId` | string | `A1EXAMPLE00001` |
| `Payload.AnyOfferChangedNotification.Offers[].Shipping` | object |  |
| `Payload.AnyOfferChangedNotification.Offers[].Shipping.Amount` | number | `0.0` |
| `Payload.AnyOfferChangedNotification.Offers[].Shipping.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Offers[].ShippingTime` | object |  |
| `Payload.AnyOfferChangedNotification.Offers[].ShippingTime.AvailabilityType` | string | `NOW` |
| `Payload.AnyOfferChangedNotification.Offers[].ShippingTime.AvailableDate` | string |  |
| `Payload.AnyOfferChangedNotification.Offers[].ShippingTime.MaximumHours` | number | `0` |
| `Payload.AnyOfferChangedNotification.Offers[].ShippingTime.MinimumHours` | number | `0` |
| `Payload.AnyOfferChangedNotification.Offers[].ShipsDomestically` | boolean | `true` |
| `Payload.AnyOfferChangedNotification.Offers[].SubCondition` | string | `good` |
| `Payload.AnyOfferChangedNotification.SellerId` | string | `A1EXAMPLE00001` |
| `Payload.AnyOfferChangedNotification.Summary` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices` | array |  |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].Condition` | string | `New` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].LandedPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].LandedPrice.Amount` | number | `42.42` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].LandedPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].ListingPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].ListingPrice.Amount` | number | `42.42` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].ListingPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].Shipping` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].Shipping.Amount` | number | `0.0` |
| `Payload.AnyOfferChangedNotification.Summary.BuyBoxPrices[].Shipping.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.CompetitivePriceThreshold` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.CompetitivePriceThreshold.Amount` | number | `20.0` |
| `Payload.AnyOfferChangedNotification.Summary.CompetitivePriceThreshold.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.ListPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.ListPrice.Amount` | number | `59.99` |
| `Payload.AnyOfferChangedNotification.Summary.ListPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices` | array |  |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].Condition` | string | `used` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].FulfillmentChannel` | string | `Merchant` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].LandedPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].LandedPrice.Amount` | number | `13.95` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].LandedPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].ListingPrice` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].ListingPrice.Amount` | number | `9.96` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].ListingPrice.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].Shipping` | object |  |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].Shipping.Amount` | number | `3.99` |
| `Payload.AnyOfferChangedNotification.Summary.LowestPrices[].Shipping.CurrencyCode` | string | `USD` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfBuyBoxEligibleOffers` | array |  |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfBuyBoxEligibleOffers[].Condition` | string | `used` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfBuyBoxEligibleOffers[].FulfillmentChannel` | string | `Merchant` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfBuyBoxEligibleOffers[].OfferCount` | number | `7` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfOffers` | array |  |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfOffers[].Condition` | string | `used` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfOffers[].FulfillmentChannel` | string | `Merchant` |
| `Payload.AnyOfferChangedNotification.Summary.NumberOfOffers[].OfferCount` | number | `7` |
| `Payload.AnyOfferChangedNotification.Summary.SalesRankings` | array |  |
| `Payload.AnyOfferChangedNotification.Summary.SalesRankings[].ProductCategoryId` | string | `example_category` |
| `Payload.AnyOfferChangedNotification.Summary.SalesRankings[].Rank` | number | `69143` |
| `PayloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "ANY_OFFER_CHANGED",
  "PayloadVersion": "1.0",
  "EventTime": "2024-11-18T14:31:09.305Z",
  "NotificationMetadata": {
    "ApplicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "SubscriptionId": "00000000-0000-0000-0000-000000000000",
    "PublishTime": "2024-11-18T14:31:09.453Z",
    "NotificationId": "00000000-0000-0000-0000-000000000000"
  },
  "Payload": {
    "AnyOfferChangedNotification": {
      "SellerId": "A1EXAMPLE00001",
      "OfferChangeTrigger": {
        "MarketplaceId": "ATVPDKIKX0DER",
        "ASIN": "B00EXAMPLE01",
        "ItemCondition": "used",
        "TimeOfOfferChange": "2024-11-18T14:31:09.116Z",
        "OfferChangeType": "Internal"
      },
      "Summary": {
        "NumberOfOffers": [
          {
            "Condition": "used",
            "FulfillmentChannel": "Merchant",
            "OfferCount": 7
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Amazon",
            "OfferCount": 7
          },
          {
            "Condition": "used",
            "FulfillmentChannel": "Amazon",
            "OfferCount": 7
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Merchant",
            "OfferCount": 5
          }
        ],
        "LowestPrices": [
          {
            "Condition": "used",
            "FulfillmentChannel": "Merchant",
            "LandedPrice": {
              "Amount": 13.95,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 9.96,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 3.99,
              "CurrencyCode": "USD"
            }
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Amazon",
            "LandedPrice": {
              "Amount": 42.42,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 42.42,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 0.0,
              "CurrencyCode": "USD"
            }
          },
          {
            "Condition": "used",
            "FulfillmentChannel": "Amazon",
            "LandedPrice": {
              "Amount": 15.27,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 15.27,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 0.0,
              "CurrencyCode": "USD"
            }
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Merchant",
            "LandedPrice": {
              "Amount": 41.15,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 41.15,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 0.0,
              "CurrencyCode": "USD"
            }
          }
        ],
        "BuyBoxPrices": [
          {
            "Condition": "New",
            "LandedPrice": {
              "Amount": 42.42,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 42.42,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 0.0,
              "CurrencyCode": "USD"
            }
          },
          {
            "Condition": "Used",
            "LandedPrice": {
              "Amount": 15.27,
              "CurrencyCode": "USD"
            },
            "ListingPrice": {
              "Amount": 15.27,
              "CurrencyCode": "USD"
            },
            "Shipping": {
              "Amount": 0.0,
              "CurrencyCode": "USD"
            }
          }
        ],
        "ListPrice": {
          "Amount": 59.99,
          "CurrencyCode": "USD"
        },
        "CompetitivePriceThreshold": {
          "Amount": 20.0,
          "CurrencyCode": "USD"
        },
        "SalesRankings": [
          {
            "ProductCategoryId": "example_category",
            "Rank": 69143
          },
          {
            "ProductCategoryId": "1234567890",
            "Rank": 21635
          }
        ],
        "NumberOfBuyBoxEligibleOffers": [
          {
            "Condition": "used",
            "FulfillmentChannel": "Merchant",
            "OfferCount": 7
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Amazon",
            "OfferCount": 7
          },
          {
            "Condition": "used",
            "FulfillmentChannel": "Amazon",
            "OfferCount": 7
          },
          {
            "Condition": "new",
            "FulfillmentChannel": "Merchant",
            "OfferCount": 4
          }
        ]
      },
      "Offers": [
        {
          "SellerId": "A1EXAMPLE00001",
          "SubCondition": "good",
          "SellerFeedbackRating": {
            "FeedbackCount": 1250,
            "SellerPositiveFeedbackRating": 98
          },
          "ShippingTime": {
            "MinimumHours": 0,
            "MaximumHours": 0,
            "AvailabilityType": "NOW",
            "AvailableDate": ""
          },
          "ListingPrice": {
            "Amount": 15.27,
            "CurrencyCode": "USD"
          },
          "Shipping": {
            "Amount": 0.0,
            "CurrencyCode": "USD"
          },
          "IsFulfilledByAmazon": true,
          "IsBuyBoxWinner": true,
          "PrimeInformation": {
            "IsOfferPrime": true,
            "IsOfferNationalPrime": true
          },
          "IsFeaturedMerchant": true,
          "ShipsDomestically": true
        },
        {
          "SellerId": "A1EXAMPLE00002",
          "SubCondition": "very_good",
          "SellerFeedbackRating": {
            "FeedbackCount": 81877,
            "SellerPositiveFeedbackRating": 96
          },
          "ShippingTime": {
            "MinimumHours": 24,
            "MaximumHours": 48,
            "AvailabilityType": "NOW",
            "AvailableDate": ""
          },
          "ListingPrice": {
            "Amount": 9.96,
            "CurrencyCode": "USD"
          },
          "Shipping": {
            "Amount": 3.99,
            "CurrencyCode": "USD"
          },
          "ShipsFrom": {
            "Country": "US",
            "State": "TX"
          },
          "IsFulfilledByAmazon": false,
          "IsBuyBoxWinner": false,
          "PrimeInformation": {
            "IsOfferPrime": false,
            "IsOfferNationalPrime": false
          },
          "IsFeaturedMerchant": true,
          "ShipsDomestically": true
        },
        {
          "SellerId": "A1EXAMPLE00003",
          "SubCondition": "good",
          "SellerFeedbackRating": {
            "FeedbackCount": 739,
            "SellerPositiveFeedbackRating": 96
          },
          "ShippingTime": {
            "MinimumHours": 0,
            "MaximumHours": 0,
            "AvailabilityType": "NOW",
            "AvailableDate": ""
          },
          "ListingPrice": {
            "Amount": 15.49,
            "CurrencyCode": "USD"
          },
          "Shipping": {
            "Amount": 0.0,
            "CurrencyCode": "USD"
          },
          "IsFulfilledByAmazon": true,
          "IsBuyBoxWinner": false,
          "PrimeInformation": {
            "IsOfferPrime": true,
            "IsOfferNationalPrime": true
          },
          "IsFeaturedMerchant": true,
          "ShipsDomestically": true
        },
        {
          "SellerId": "A1EXAMPLE00004",
          "SubCondition": "good",
          "SellerFeedbackRating": {
            "FeedbackCount": 11,
            "SellerPositiveFeedbackRating": 91
          },
          "ShippingTime": {
            "MinimumHours": 0,
            "MaximumHours": 0,
            "AvailabilityType": "FUTURE_WITH_DATE",
            "AvailableDate": "2024-11-21T12:00:00.000Z"
          },
          "ListingPrice": {
            "Amount": 16.25,
            "CurrencyCode": "USD"
          },
          "Shipping": {
            "Amount": 0.0,
            "CurrencyCode": "USD"
          },
          "IsFulfilledByAmazon": true,
          "IsBuyBoxWinner": false,
          "PrimeInformation": {
            "IsOfferPrime": true,
            "IsOfferNationalPrime": true
          },
          "IsFeaturedMerchant": true,
          "ShipsDomestically": true
        }
      ]
    }
  }
}
```

</details>

## Context

Projected currency values on context are in major units (15.27). Raw listing.data retains Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `listing` | object | no |  |
| `listing.adGroups` | array | no |  |
| `listing.adGroups[].asinCount` | number | no | Distinct ASINs advertised in the ad group. |
| `listing.adGroups[].defaultBid` | string | yes | Decimal string rather than a number ("0.75"). parseFloat before comparing. |
| `listing.adGroups[].id` | string | yes |  |
| `listing.adGroups[].metrics30` | object | no |  |
| `listing.adGroups[].metrics30.acos` | number | yes | cost / sales over the trailing 30 days. Null when sales is zero. |
| `listing.adGroups[].metrics30.clicks` | number | no |  |
| `listing.adGroups[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `listing.adGroups[].metrics30.impressions` | number | no |  |
| `listing.adGroups[].metrics30.roas` | number | yes | sales / cost over the trailing 30 days. Null when cost is zero. |
| `listing.adGroups[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `listing.adGroups[].name` | string | yes |  |
| `listing.adGroups[].state` | string | yes |  |
| `listing.ads` | array | no |  |
| `listing.ads[].asin` | string | yes |  |
| `listing.ads[].id` | string | yes |  |
| `listing.ads[].sku` | string | yes |  |
| `listing.ads[].state` | string | yes |  |
| `listing.asin` | string | no |  |
| `listing.b2bPrice` | number | yes | Null when the listing has no B2B offer. |
| `listing.b2bUnitsSold` | number | no | Trailing 30 days, rolled up eagerly. Always a number: zero rather than absent with no B2B sales. |
| `listing.buyable` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listing.campaigns` | array | no |  |
| `listing.campaigns[].asinCount` | number | no | Distinct ASINs advertised in the campaign, not just this listing's. |
| `listing.campaigns[].budget` | string | yes | Daily budget in major units, and a decimal string rather than a number ("50.0"). parseFloat before comparing. |
| `listing.campaigns[].id` | string | yes |  |
| `listing.campaigns[].metrics30` | object | no |  |
| `listing.campaigns[].metrics30.acos` | number | yes | cost / sales over the trailing 30 days. Null when sales is zero. |
| `listing.campaigns[].metrics30.clicks` | number | no |  |
| `listing.campaigns[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `listing.campaigns[].metrics30.impressions` | number | no |  |
| `listing.campaigns[].metrics30.roas` | number | yes | sales / cost over the trailing 30 days. Null when cost is zero. |
| `listing.campaigns[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `listing.campaigns[].name` | string | yes |  |
| `listing.campaigns[].state` | string | yes |  |
| `listing.campaigns[].targetingType` | string | yes |  |
| `listing.ceiling` | number | yes | Upper price bound as Amazon last reported it. Null when unset. Same lifecycle as floor. |
| `listing.condition` | string | yes | Family of conditionType: new, used, collectible, refurbished or club. Null until Amazon reports it. |
| `listing.conditionType` | string | yes | Amazon's full condition token, such as used_very_good. Null until the listing item reports it. |
| `listing.data` | object | no | Raw Amazon source snapshots, with original keys and units. Contents vary with the sources received; missing sources are absent. FBA report stock is under data.fba.inventory (afn-fulfillable-quantity, afn-inbound-shipped-quantity, etc.). Submitted MFN stock is under data.listings_item.attributes.fulfillment_availability; observed availability is under data.listings_item.fulfillmentAvailability. data.notifications holds the latest accepted envelope of each type, including EventTime. Notifications do not overwrite report or crawl snapshots. Choose the source and stock measure your automation needs. |
| `listing.deleted` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listing.discoverable` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listing.enabled` | boolean | no |  |
| `listing.fba` | object | yes | FBA inventory and planning report data, camelCased from Amazon's hyphenated report columns. Null for MFN listings. Keys vary by report, so treat anything below it as optional. |
| `listing.fba.agedInventory` | object | no | Unit counts per age bucket, as decimal strings. |
| `listing.fba.agedInventory.invAge0To90Days` | string | no |  |
| `listing.fba.agedInventory.invAge181To270Days` | string | no |  |
| `listing.fba.agedInventory.invAge271To365Days` | string | no |  |
| `listing.fba.agedInventory.invAge365PlusDays` | string | no |  |
| `listing.fba.agedInventory.invAge91To180Days` | string | no |  |
| `listing.fba.inventory` | object | no | Quantities arrive as decimal strings, not numbers. parseInt before arithmetic. |
| `listing.fba.inventory.afnFulfillableQuantity` | string | no |  |
| `listing.fba.inventory.afnInboundShippedQuantity` | string | no |  |
| `listing.fba.inventory.afnResearchingQuantity` | string | no |  |
| `listing.fba.inventory.afnReservedQuantity` | string | no |  |
| `listing.fba.inventory.afnTotalQuantity` | string | no |  |
| `listing.fba.inventory.afnUnsellableQuantity` | string | no |  |
| `listing.fba.inventory.afnWarehouseQuantity` | string | no |  |
| `listing.fba.planning` | object | no | Restock planning figures, as decimal strings. |
| `listing.fba.planning.available` | string | no |  |
| `listing.fba.planning.estimatedExcessQuantity` | string | no |  |
| `listing.fba.planning.sellThrough` | string | no |  |
| `listing.fba.planning.unitsShippedT90` | string | no |  |
| `listing.fba.planning.weeksOfCoverT90` | string | no |  |
| `listing.fc` | object | yes | Fulfillment-centre report data. Null when no report has landed. Keys vary by report. |
| `listing.fc.shelfLife` | object | no |  |
| `listing.fc.shelfLife.unit` | string | no |  |
| `listing.fc.shelfLife.value` | number | no |  |
| `listing.floor` | number | yes | Lower price bound as Amazon last reported it. Null when unset. A bound you set goes to Amazon and shows here once Amazon's next reading reflects it; until then list_listings lists it under mutations. |
| `listing.fulfillmentChannel` | string | no | Either "Amazon" (FBA) or "Merchant" (MFN). Never null. |
| `listing.handlingTime` | number | yes | Business days from order to ship (Amazon's lead_time_to_ship_max_days). Null when the SKU uses the account's default handling time. Writable on listings you fulfil yourself. A write queues only the requested handling time; it does not resend observed stock. |
| `listing.id` | string | no |  |
| `listing.keywords` | array | no |  |
| `listing.keywords[].bid` | string | yes | Decimal string rather than a number ("0.85"). parseFloat before comparing. |
| `listing.keywords[].id` | string | yes |  |
| `listing.keywords[].matchType` | string | yes |  |
| `listing.keywords[].metrics30` | object | no |  |
| `listing.keywords[].metrics30.acos` | number | yes | cost / sales over the trailing 30 days. Null when sales is zero. |
| `listing.keywords[].metrics30.clicks` | number | no |  |
| `listing.keywords[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `listing.keywords[].metrics30.impressions` | number | no |  |
| `listing.keywords[].metrics30.roas` | number | yes | sales / cost over the trailing 30 days. Null when cost is zero. |
| `listing.keywords[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `listing.keywords[].state` | string | yes |  |
| `listing.keywords[].text` | string | yes | The keyword expression. Named text here and expression in the Ads API. |
| `listing.mutations` | array | no | Recent mutations for the listing: all queued requests and the latest submission. Use status === "queued" to check for in-flight changes. |
| `listing.mutations[].accepted` | boolean | no | Whether Amazon accepted the request for processing; false when rejected. |
| `listing.mutations[].createdAt` | string | no |  |
| `listing.mutations[].id` | string | no |  |
| `listing.mutations[].payload` | object | no |  |
| `listing.mutations[].response` | object | no |  |
| `listing.mutations[].status` | string | no | "queued" (awaiting submission) or "submitted" (Amazon response recorded). |
| `listing.mutations[].submissionId` | string | no | Amazon's submissionId for the patch that carried this mutation. |
| `listing.mutations[].submittedAt` | string | no | ISO 8601 timestamp when Amazon's response was recorded. |
| `listing.price` | number | yes | Major units (15.27). list_listings reports the same figure as 1527. |
| `listing.restockDate` | string | yes | YYYY-MM-DD the listing is back in stock. Null when unset. Writable on listings you fulfil yourself. |
| `listing.shipping` | number | yes | Zero when Amazon fulfils. On a listing you fulfil, null until an offer event carries your own offer; Pulsify no longer polls for it. |
| `listing.shippingGroup` | string | yes | Merchant shipping template id, not its display name. Null until Amazon reports one; FBA listings have none. Writable on listings you fulfil yourself. |
| `listing.statuses` | array | yes | Null until Amazon first reports listing status. Null means unknown, not empty. buyable, discoverable and deleted derive from it and are null alongside it. |
| `listing.statuses[]` | string | no | One of "BUYABLE", "DISCOVERABLE", "DELETED". |
| `marketplace` | object | no |  |
| `marketplace.timeZone` | string | no | IANA zone for the listing's marketplace. Use it for any hour-of-day logic. |
| `mutations` | array | no | Mutation outbox array. Listing writes require a non-empty patches array of native Amazon operations. Flat fields such as price, floor and quantity are not accepted; use update_listing to change the local enabled switch. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
