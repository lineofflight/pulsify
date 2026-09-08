# Pricing Health

`PRICING_HEALTH` · Seller Central · listing context

Your offer loses Buy Box eligibility due to uncompetitive pricing.

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#pricing_health)

## Default template

Restores Buy Box eligibility by setting competitive prices when Amazon flags uncompetitive pricing.

```js
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
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `eventTime` | string | `2024-01-15T10:30:00Z` |
| `notificationMetadata` | object |  |
| `notificationMetadata.applicationId` | string | `amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.notificationId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.publishTime` | string | `2024-01-15T10:30:00Z` |
| `notificationMetadata.subscriptionId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationType` | string | `PRICING_HEALTH` |
| `notificationVersion` | string | `1.0` |
| `payload` | object |  |
| `payload.issueType` | string | `BuyBoxDisqualification` |
| `payload.merchantOffer` | object |  |
| `payload.merchantOffer.condition` | string | `New` |
| `payload.merchantOffer.fulfillmentType` | string | `MFN` |
| `payload.merchantOffer.landedPrice` | object |  |
| `payload.merchantOffer.landedPrice.amount` | string | `29.98` |
| `payload.merchantOffer.landedPrice.currencyCode` | string | `USD` |
| `payload.merchantOffer.listingPrice` | object |  |
| `payload.merchantOffer.listingPrice.amount` | string | `24.99` |
| `payload.merchantOffer.listingPrice.currencyCode` | string | `USD` |
| `payload.merchantOffer.shipping` | object |  |
| `payload.merchantOffer.shipping.amount` | string | `4.99` |
| `payload.merchantOffer.shipping.currencyCode` | string | `USD` |
| `payload.offerChangeTrigger` | object |  |
| `payload.offerChangeTrigger.asin` | string | `B00EXAMPLE01` |
| `payload.offerChangeTrigger.itemCondition` | string | `New` |
| `payload.offerChangeTrigger.marketplaceId` | string | `ATVPDKIKX0DER` |
| `payload.offerChangeTrigger.timeOfOfferChange` | string | `2024-01-15T10:30:00Z` |
| `payload.sellerId` | string | `A1EXAMPLE00001` |
| `payload.summary` | object |  |
| `payload.summary.buyBoxEligibleOffers` | array |  |
| `payload.summary.buyBoxEligibleOffers[].condition` | string | `New` |
| `payload.summary.buyBoxEligibleOffers[].fulfillmentType` | string | `MFN` |
| `payload.summary.buyBoxEligibleOffers[].offerCount` | number | `12` |
| `payload.summary.buyBoxPrices` | array |  |
| `payload.summary.buyBoxPrices[].condition` | string | `New` |
| `payload.summary.buyBoxPrices[].landedPrice` | object |  |
| `payload.summary.buyBoxPrices[].landedPrice.amount` | string | `18.99` |
| `payload.summary.buyBoxPrices[].landedPrice.currencyCode` | string | `USD` |
| `payload.summary.buyBoxPrices[].listingPrice` | object |  |
| `payload.summary.buyBoxPrices[].listingPrice.amount` | string | `18.99` |
| `payload.summary.buyBoxPrices[].listingPrice.currencyCode` | string | `USD` |
| `payload.summary.buyBoxPrices[].shipping` | object |  |
| `payload.summary.buyBoxPrices[].shipping.amount` | string | `0.00` |
| `payload.summary.buyBoxPrices[].shipping.currencyCode` | string | `USD` |
| `payload.summary.numberOfOffers` | array |  |
| `payload.summary.numberOfOffers[].condition` | string | `New` |
| `payload.summary.numberOfOffers[].fulfillmentType` | string | `MFN` |
| `payload.summary.numberOfOffers[].offerCount` | number | `15` |
| `payload.summary.referencePrice` | object |  |
| `payload.summary.referencePrice.averageSellingPrice` | object |  |
| `payload.summary.referencePrice.averageSellingPrice.amount` | string | `22.50` |
| `payload.summary.referencePrice.averageSellingPrice.currencyCode` | string | `USD` |
| `payload.summary.referencePrice.competitivePriceThreshold` | object |  |
| `payload.summary.referencePrice.competitivePriceThreshold.amount` | string | `19.99` |
| `payload.summary.referencePrice.competitivePriceThreshold.currencyCode` | string | `USD` |
| `payload.summary.salesRankings` | array |  |
| `payload.summary.salesRankings[].productCategoryId` | string | `toy_display_on_website` |
| `payload.summary.salesRankings[].rank` | number | `12345` |
| `payloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationVersion": "1.0",
  "notificationType": "PRICING_HEALTH",
  "payloadVersion": "1.0",
  "eventTime": "2024-01-15T10:30:00Z",
  "notificationMetadata": {
    "applicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "subscriptionId": "00000000-0000-0000-0000-000000000000",
    "publishTime": "2024-01-15T10:30:00Z",
    "notificationId": "00000000-0000-0000-0000-000000000000"
  },
  "payload": {
    "issueType": "BuyBoxDisqualification",
    "sellerId": "A1EXAMPLE00001",
    "offerChangeTrigger": {
      "marketplaceId": "ATVPDKIKX0DER",
      "asin": "B00EXAMPLE01",
      "itemCondition": "New",
      "timeOfOfferChange": "2024-01-15T10:30:00Z"
    },
    "merchantOffer": {
      "condition": "New",
      "fulfillmentType": "MFN",
      "listingPrice": {
        "amount": "24.99",
        "currencyCode": "USD"
      },
      "shipping": {
        "amount": "4.99",
        "currencyCode": "USD"
      },
      "landedPrice": {
        "amount": "29.98",
        "currencyCode": "USD"
      }
    },
    "summary": {
      "numberOfOffers": [
        {
          "condition": "New",
          "fulfillmentType": "MFN",
          "offerCount": 15
        },
        {
          "condition": "New",
          "fulfillmentType": "AFN",
          "offerCount": 3
        }
      ],
      "buyBoxEligibleOffers": [
        {
          "condition": "New",
          "fulfillmentType": "MFN",
          "offerCount": 12
        },
        {
          "condition": "New",
          "fulfillmentType": "AFN",
          "offerCount": 3
        }
      ],
      "referencePrice": {
        "competitivePriceThreshold": {
          "amount": "19.99",
          "currencyCode": "USD"
        },
        "averageSellingPrice": {
          "amount": "22.50",
          "currencyCode": "USD"
        }
      },
      "buyBoxPrices": [
        {
          "condition": "New",
          "listingPrice": {
            "amount": "18.99",
            "currencyCode": "USD"
          },
          "shipping": {
            "amount": "0.00",
            "currencyCode": "USD"
          },
          "landedPrice": {
            "amount": "18.99",
            "currencyCode": "USD"
          }
        }
      ],
      "salesRankings": [
        {
          "productCategoryId": "toy_display_on_website",
          "rank": 12345
        }
      ]
    }
  }
}
```

</details>

## Context

Every currency value on context is in major units (15.27). The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

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
| `listing.deleted` | boolean | no | Always a boolean, unlike buyable and discoverable, which go missing while statuses is unset. |
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
| `listing.quantity` | number | yes | Available quantity. Null when Amazon has not reported one. Writable on listings you fulfil yourself; a write there is rejected on an FBA listing. |
| `listing.restockDate` | string | yes | YYYY-MM-DD the listing is back in stock. Null when unset. Writable on listings you fulfil yourself. |
| `listing.shipping` | number | yes | Zero when Amazon fulfils. On a listing you fulfil, null until an offer event carries your own offer; Pulsify no longer polls for it. |
| `listing.shippingGroup` | string | yes | Merchant shipping template id, not its display name. Null until Amazon reports one; FBA listings have none. Writable on listings you fulfil yourself. |
| `listing.statuses` | array | yes | Null until Amazon first reports listing status. Null means unknown, not empty. buyable and discoverable derive from it and are null alongside it. |
| `listing.statuses[]` | string | no | One of "BUYABLE", "DISCOVERABLE", "DELETED". |
| `marketplace` | object | no |  |
| `marketplace.timeZone` | string | no | IANA zone for the listing's marketplace. Use it for any hour-of-day logic. |
| `mutations` | array | no | Mutation outbox array. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
