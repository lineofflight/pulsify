# Feed Processing Finished

`FEED_PROCESSING_FINISHED` · Seller Central · seller context

Feed submissions reach a terminal state (DONE, CANCELLED, FATAL).

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#feed_processing_finished)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  var payload = event.payload?.feedProcessingFinishedNotification;
  if (!payload) return context;

  // processingStatus: "DONE" | "CANCELLED" | "FATAL".
  // payload.resultFeedDocumentId is present when results are available.
  console.log(
    "Feed " +
      payload.feedId +
      " (" +
      payload.feedType +
      "): " +
      payload.processingStatus,
  );
  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `eventTime` | string | `2026-05-12T14:31:09.305Z` |
| `notificationMetadata` | object |  |
| `notificationMetadata.applicationId` | string | `amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.notificationId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationMetadata.publishTime` | string | `2026-05-12T14:31:09.453Z` |
| `notificationMetadata.subscriptionId` | string | `00000000-0000-0000-0000-000000000000` |
| `notificationType` | string | `FEED_PROCESSING_FINISHED` |
| `notificationVersion` | string | `1.0` |
| `payload` | object |  |
| `payload.feedProcessingFinishedNotification` | object |  |
| `payload.feedProcessingFinishedNotification.accountId` | string | `A1EXAMPLE00001` |
| `payload.feedProcessingFinishedNotification.feedId` | string | `00012345678` |
| `payload.feedProcessingFinishedNotification.feedType` | string | `POST_PRODUCT_PRICING_DATA` |
| `payload.feedProcessingFinishedNotification.processingStatus` | string | `DONE` |
| `payload.feedProcessingFinishedNotification.resultFeedDocumentId` | string | `amzn1.tortuga.4.eu.00000000-0000-0000-0000-000000000000` |
| `payload.feedProcessingFinishedNotification.sellerId` | string | `A1EXAMPLE00001` |
| `payloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationVersion": "1.0",
  "notificationType": "FEED_PROCESSING_FINISHED",
  "payloadVersion": "1.0",
  "eventTime": "2026-05-12T14:31:09.305Z",
  "notificationMetadata": {
    "applicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "subscriptionId": "00000000-0000-0000-0000-000000000000",
    "publishTime": "2026-05-12T14:31:09.453Z",
    "notificationId": "00000000-0000-0000-0000-000000000000"
  },
  "payload": {
    "feedProcessingFinishedNotification": {
      "accountId": "A1EXAMPLE00001",
      "sellerId": "A1EXAMPLE00001",
      "feedId": "00012345678",
      "feedType": "POST_PRODUCT_PRICING_DATA",
      "processingStatus": "DONE",
      "resultFeedDocumentId": "amzn1.tortuga.4.eu.00000000-0000-0000-0000-000000000000"
    }
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
