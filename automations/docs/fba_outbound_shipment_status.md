# FBA Outbound Shipment Status

`FBA_OUTBOUND_SHIPMENT_STATUS` · Seller Central · seller context

FBA outbound shipments transition to a notable lifecycle state (e.g. Shipped, Cancelled).

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#fba_outbound_shipment_status)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  var payload = event.Payload?.FBAOutboundShipmentStatusNotification;
  if (!payload) return context;

  // ShipmentStatus: e.g. "Shipped", "Cancelled".
  console.log(
    "Order " +
      payload.AmazonOrderId +
      " shipment " +
      payload.AmazonShipmentId +
      ": " +
      payload.ShipmentStatus,
  );
  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `EventTime` | string | `2026-05-12T14:31:09.305Z` |
| `NotificationMetadata` | object |  |
| `NotificationMetadata.ApplicationId` | string | `amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000` |
| `NotificationMetadata.NotificationId` | string | `00000000-0000-0000-0000-000000000000` |
| `NotificationMetadata.PublishTime` | string | `2026-05-12T14:31:09.453Z` |
| `NotificationMetadata.SubscriptionId` | string | `00000000-0000-0000-0000-000000000000` |
| `NotificationType` | string | `FBA_OUTBOUND_SHIPMENT_STATUS` |
| `NotificationVersion` | string | `1.0` |
| `Payload` | object |  |
| `Payload.FBAOutboundShipmentStatusNotification` | object |  |
| `Payload.FBAOutboundShipmentStatusNotification.AmazonOrderId` | string | `902-1845936-5435065` |
| `Payload.FBAOutboundShipmentStatusNotification.AmazonShipmentId` | string | `DnMb01Lp1` |
| `Payload.FBAOutboundShipmentStatusNotification.SellerId` | string | `A1EXAMPLE00001` |
| `Payload.FBAOutboundShipmentStatusNotification.ShipmentStatus` | string | `Shipped` |
| `PayloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "FBA_OUTBOUND_SHIPMENT_STATUS",
  "PayloadVersion": "1.0",
  "EventTime": "2026-05-12T14:31:09.305Z",
  "NotificationMetadata": {
    "ApplicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "SubscriptionId": "00000000-0000-0000-0000-000000000000",
    "PublishTime": "2026-05-12T14:31:09.453Z",
    "NotificationId": "00000000-0000-0000-0000-000000000000"
  },
  "Payload": {
    "FBAOutboundShipmentStatusNotification": {
      "SellerId": "A1EXAMPLE00001",
      "AmazonOrderId": "902-1845936-5435065",
      "AmazonShipmentId": "DnMb01Lp1",
      "ShipmentStatus": "Shipped"
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
