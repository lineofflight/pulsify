# Target Change

`TARGET_CHANGE` · Amazon Ads · change context

A keyword or product target is created or changes (state, bid), in near real time.

[Amazon's documentation](https://advertising.amazon.com/API/docs/en-us/amazon-marketing-stream/data-guide)

## Default template

No action. Add your logic here.

```js
// Target-change automation. Fires when a keyword or product target is created or changes.
// `context.change` is the changed entity as Amazon sent it; `context.campaign`
// is your synced campaign when Pulsify knows it.
// Careful: changes Pulsify itself makes come back as events. Guard against
// reacting to your own mutations.
function handle(event, context) {
  // No action. Add your logic here.
  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `adGroupId` | string | `22222` |
| `bid` | number | `0.5` |
| `campaignId` | string | `11111` |
| `dataset_id` | string | `targets` |
| `lastUpdatedDateTime` | string | `2026-06-06T12:00:00Z` |
| `notificationType` | string | `TARGET_CHANGE` |
| `state` | string | `ENABLED` |
| `targetDetails` | object |  |
| `targetDetails.keyword` | string | `example` |
| `targetDetails.matchType` | string | `BROAD` |
| `targetId` | string | `44444` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationType": "TARGET_CHANGE",
  "dataset_id": "targets",
  "targetId": "44444",
  "adGroupId": "22222",
  "campaignId": "11111",
  "state": "ENABLED",
  "bid": 0.5,
  "targetDetails": {
    "matchType": "BROAD",
    "keyword": "example"
  },
  "lastUpdatedDateTime": "2026-06-06T12:00:00Z"
}
```

</details>

## Context

Every currency value on context is in major units (15.27). The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `budget` | object | no |  |
| `budget.amount` | number | yes | The budget figure carried by the firing event, not the campaign's current budget. Null outside budget-usage events. |
| `budget.scopeType` | string | yes | Which half of the context you were handed: "CAMPAIGN" means context.campaign is present, "PORTFOLIO" means context.portfolio is present. Null outside budget-usage events. |
| `budget.updatedAt` | string | yes | ISO 8601 event time. Null outside budget-usage events. |
| `budget.usagePercentage` | number | yes | Percentage of budget consumed, 0-100. Amazon emits one per 5% increment. Null outside budget-usage events. |
| `campaign` | object | no |  |
| `campaign.adProduct` | string | no |  |
| `campaign.budget` | string | no | Daily budget in major units. A number on budget-usage events and a decimal string on entity-change events. parseFloat handles both. |
| `campaign.campaignId` | number | no |  |
| `campaign.id` | string | yes | Pulsify's own id. Null when the changed campaign has not been synced yet. |
| `campaign.name` | string | no |  |
| `campaign.state` | string | no |  |
| `campaign.targetingType` | string | no |  |
| `change` | object | no | The raw entity-change payload as Amazon sent it, camelCase and unmodified. Keys differ per stream type, so read defensively. |
| `change.adGroupId` | string | no |  |
| `change.bid` | number | no |  |
| `change.campaignId` | string | no |  |
| `change.dataset_id` | string | no | snake_case, as Amazon sends it. |
| `change.lastUpdatedDateTime` | string | no |  |
| `change.notificationType` | string | no |  |
| `change.state` | string | no |  |
| `change.targetDetails` | object | no |  |
| `change.targetDetails.keyword` | string | no |  |
| `change.targetDetails.matchType` | string | no |  |
| `change.targetId` | string | no |  |
| `hourlyConversions` | array | no |  |
| `hourlyTraffic` | array | no |  |
| `mutations` | array | no | Mutation outbox array. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
