# Account Status Changed

`ACCOUNT_STATUS_CHANGED` · Seller Central · seller context

Seller account health transitions (NORMAL, AT_RISK, DEACTIVATED).

[Amazon's documentation](https://developer-docs.amazon.com/sp-api/docs/notification-type-values#account_status_changed)

## Default template

No action. Add your logic here.

```js
function handle(event, context) {
  var payload = event.payload?.accountStatusChangeNotification;
  if (!payload) return context;

  // currentAccountStatus: "NORMAL" | "AT_RISK" | "DEACTIVATED";
  // previousAccountStatus may be undefined.
  console.log(
    "Account status: " +
      payload.currentAccountStatus +
      " (was " +
      (payload.previousAccountStatus || "unknown") +
      ")",
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
| `notificationType` | string | `ACCOUNT_STATUS_CHANGED` |
| `notificationVersion` | string | `1.0` |
| `payload` | object |  |
| `payload.accountStatusChangeNotification` | object |  |
| `payload.accountStatusChangeNotification.currentAccountStatus` | string | `AT_RISK` |
| `payload.accountStatusChangeNotification.previousAccountStatus` | string | `NORMAL` |
| `payloadVersion` | string | `1.0` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationVersion": "1.0",
  "notificationType": "ACCOUNT_STATUS_CHANGED",
  "payloadVersion": "1.0",
  "eventTime": "2026-05-12T14:31:09.305Z",
  "payload": {
    "accountStatusChangeNotification": {
      "currentAccountStatus": "AT_RISK",
      "previousAccountStatus": "NORMAL"
    }
  },
  "notificationMetadata": {
    "applicationId": "amzn1.sellerapps.app.00000000-0000-0000-0000-000000000000",
    "subscriptionId": "00000000-0000-0000-0000-000000000000",
    "publishTime": "2026-05-12T14:31:09.453Z",
    "notificationId": "00000000-0000-0000-0000-000000000000"
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
