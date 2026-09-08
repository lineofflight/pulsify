# Listings Item MFN Quantity Change

`LISTINGS_ITEM_MFN_QUANTITY_CHANGE` · Seller Central · listing context

Available quantity changes for MFN listings from orders, inventory updates, or cancellations.

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#listings_item_mfn_quantity_change)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  // No-op by default. Listing state is synced automatically.
  // Add your custom logic here if needed.
  return context;
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
| `NotificationType` | string | `LISTINGS_ITEM_MFN_QUANTITY_CHANGE` |
| `NotificationVersion` | string | `1.0` |
| `Payload` | object |  |
| `Payload.FulfillmentChannelCode` | string | `DEFAULT` |
| `Payload.Quantity` | number | `25` |
| `Payload.SellerId` | string | `A1EXAMPLE00001` |
| `Payload.Sku` | string | `EXAMPLE-SKU-001` |
| `PayloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "LISTINGS_ITEM_MFN_QUANTITY_CHANGE",
  "PayloadVersion": "1.0",
  "EventTime": "2024-11-18T14:31:09.305Z",
  "NotificationMetadata": {
    "ApplicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "SubscriptionId": "00000000-0000-0000-0000-000000000000",
    "PublishTime": "2024-11-18T14:31:09.453Z",
    "NotificationId": "00000000-0000-0000-0000-000000000000"
  },
  "Payload": {
    "SellerId": "A1EXAMPLE00001",
    "Sku": "EXAMPLE-SKU-001",
    "FulfillmentChannelCode": "DEFAULT",
    "Quantity": 25
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
