# Detail Page Traffic Event

`DETAIL_PAGE_TRAFFIC_EVENT` · Seller Central · seller context

Hourly detail page glance views per ASIN. Requires Brand Analytics..

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#detail_page_traffic_event)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  // No-op. Add your logic here.
  //
  // event.payload.detailPageTrafficEvents is an array of hourly traffic aggregates,
  // one per (asin, marketplaceId). Each entry has:
  //   change.asin
  //   change.marketplaceId
  //   change.glanceViews       // detail page views for this ASIN in the window
  //   change.startTime         // ISO 8601 window start
  //   change.endTime           // ISO 8601 window end
  //   change.accountId         // amzn1.merchant.o.<sellingPartnerId>
  //
  // context.selling_partner.selling_partner_id
  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `eventTime` | string | `2026-06-06T16:05:32.378Z` |
| `notificationMetadata` | object |  |
| `notificationMetadata.applicationId` | string | `amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.notificationId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.publishTime` | string | `2026-06-06T16:05:32.453Z` |
| `notificationMetadata.subscriptionId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationType` | string | `DETAIL_PAGE_TRAFFIC_EVENT` |
| `notificationVersion` | string | `2020-09-04` |
| `payload` | object |  |
| `payload.detailPageTrafficEvents` | array |  |
| `payload.detailPageTrafficEvents[].accountId` | string | `amzn1.merchant.o.A1EXAMPLE00001` |
| `payload.detailPageTrafficEvents[].asin` | string | `B00032HE0O` |
| `payload.detailPageTrafficEvents[].endTime` | string | `2026-06-06T16:00:00Z` |
| `payload.detailPageTrafficEvents[].glanceViews` | number | `42` |
| `payload.detailPageTrafficEvents[].marketplaceId` | string | `ATVPDKIKX0DER` |
| `payload.detailPageTrafficEvents[].startTime` | string | `2026-06-06T15:00:00Z` |
| `payloadVersion` | string | `2020-09-04` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationVersion": "2020-09-04",
  "notificationType": "DETAIL_PAGE_TRAFFIC_EVENT",
  "payloadVersion": "2020-09-04",
  "eventTime": "2026-06-06T16:05:32.378Z",
  "payload": {
    "detailPageTrafficEvents": [
      {
        "accountId": "amzn1.merchant.o.A1EXAMPLE00001",
        "marketplaceId": "ATVPDKIKX0DER",
        "startTime": "2026-06-06T15:00:00Z",
        "endTime": "2026-06-06T16:00:00Z",
        "asin": "B00032HE0O",
        "glanceViews": 42
      },
      {
        "accountId": "amzn1.merchant.o.A1EXAMPLE00001",
        "marketplaceId": "ATVPDKIKX0DER",
        "startTime": "2026-06-06T15:00:00Z",
        "endTime": "2026-06-06T16:00:00Z",
        "asin": "B00094A20U",
        "glanceViews": 69
      }
    ]
  },
  "notificationMetadata": {
    "applicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "subscriptionId": "00000000-0000-0000-0000-000000000000",
    "publishTime": "2026-06-06T16:05:32.453Z",
    "notificationId": "00000000-0000-0000-0000-000000000000"
  }
}
```

</details>

## Context

Projected currency values on context are in major units (15.27). Raw listing.data retains Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `mutations` | array | no | Mutation outbox array. Listing writes require a non-empty patches array of native Amazon operations. Flat fields such as price, floor and quantity are not accepted; use update_listing to change the local enabled switch. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
| `selling_partner` | object | no |  |
| `selling_partner.id` | string | no |  |
| `selling_partner.marketplace_id` | string | no | snake_case, as above. |
| `selling_partner.selling_partner_id` | string | no | snake_case, unlike every other context key. Historic, and renaming it would break live automations. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
