# Fulfillment Order Status

`FULFILLMENT_ORDER_STATUS` · Seller Central · seller context

Multi-Channel Fulfillment orders transition between lifecycle states (e.g. Received, Processing, Complete, Cancelled).

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#fulfillment_order_status)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  var payload = event.Payload?.FulfillmentOrderStatusNotification;
  if (!payload) return context;

  var line =
    "Fulfillment order " +
    payload.SellerFulfillmentOrderId +
    ": " +
    payload.FulfillmentOrderStatus;
  var shipment = payload.FulfillmentShipment; // absent until a shipment exists
  if (shipment) {
    line +=
      " (shipment " +
      shipment.AmazonShipmentId +
      ": " +
      shipment.FulfillmentShipmentStatus +
      ")";
  }
  console.log(line);
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
| `NotificationType` | string | `FULFILLMENT_ORDER_STATUS` |
| `NotificationVersion` | string | `1.0` |
| `Payload` | object |  |
| `Payload.FulfillmentOrderStatusNotification` | object |  |
| `Payload.FulfillmentOrderStatusNotification.EventType` | string | `TYPE3945` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentOrderStatus` | string | `COMPLETE` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment` | object |  |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.AmazonShipmentId` | string | `ASID49535` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.EstimatedArrivalDateTime` | string | `2026-05-13T14:31:09.305Z` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.FulfillmentShipmentPackages` | array |  |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.FulfillmentShipmentPackages[].CarrierCode` | string | `UPS` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.FulfillmentShipmentPackages[].PackageNumber` | number | `1` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.FulfillmentShipmentPackages[].TrackingNumber` | string | `1Z84456456573405` |
| `Payload.FulfillmentOrderStatusNotification.FulfillmentShipment.FulfillmentShipmentStatus` | string | `SHIPPED` |
| `Payload.FulfillmentOrderStatusNotification.SellerFulfillmentOrderId` | string | `SFOID2345` |
| `Payload.FulfillmentOrderStatusNotification.SellerId` | string | `A1EXAMPLE00001` |
| `Payload.FulfillmentOrderStatusNotification.StatusUpdatedDateTime` | string | `2026-05-12T14:31:09.305Z` |
| `PayloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "FULFILLMENT_ORDER_STATUS",
  "PayloadVersion": "1.0",
  "EventTime": "2026-05-12T14:31:09.305Z",
  "NotificationMetadata": {
    "ApplicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "SubscriptionId": "00000000-0000-0000-0000-000000000000",
    "PublishTime": "2026-05-12T14:31:09.453Z",
    "NotificationId": "00000000-0000-0000-0000-000000000000"
  },
  "Payload": {
    "FulfillmentOrderStatusNotification": {
      "SellerId": "A1EXAMPLE00001",
      "EventType": "TYPE3945",
      "StatusUpdatedDateTime": "2026-05-12T14:31:09.305Z",
      "SellerFulfillmentOrderId": "SFOID2345",
      "FulfillmentOrderStatus": "COMPLETE",
      "FulfillmentShipment": {
        "FulfillmentShipmentStatus": "SHIPPED",
        "AmazonShipmentId": "ASID49535",
        "EstimatedArrivalDateTime": "2026-05-13T14:31:09.305Z",
        "FulfillmentShipmentPackages": [
          {
            "PackageNumber": 1,
            "CarrierCode": "UPS",
            "TrackingNumber": "1Z84456456573405"
          }
        ]
      }
    }
  }
}
```

</details>

## Context

Every currency value on context is in major units (15.27). The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `mutations` | array | no | Mutation outbox array. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
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
