# SP Conversion

`SP_CONVERSION` · Amazon Ads · metrics context

Hourly Sponsored Products attributed conversions and sales per campaign, ad group, ad, and keyword.

[Amazon's documentation](https://advertising.amazon.com/API/docs/en-us/amazon-marketing-stream/data-guide)

## Default template

No action. Add your logic here.

```js
// Hourly Sponsored Products conversions. Fires once per campaign per hour,
// on the first delta Amazon sends for that hour. `context.metrics` is this
// hour's attributed orders, sales, and units (1-day attribution) summed
// across the campaign. `context.hourlyTraffic` and
// `context.hourlyConversions` are the trailing 24 hours. Later restatements
// of the same hour update those rollups but do not fire again.
function handle(event, context) {
  // No action. Add your logic here.
  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `campaign_id` | string | `11111` |
| `dataset_id` | string | `sp-conversion` |
| `metrics` | object |  |
| `metrics.conversions` | number | `1.0` |
| `metrics.sales` | number | `30.0` |
| `metrics.units_ordered` | number | `2.0` |
| `record_count` | number | `2` |
| `time_window_start` | string | `2026-06-06T11:00:00Z` |

<details>
<summary>Sample payload</summary>

```json
{
  "dataset_id": "sp-conversion",
  "campaign_id": "11111",
  "time_window_start": "2026-06-06T11:00:00Z",
  "record_count": 2,
  "metrics": {
    "conversions": 1.0,
    "sales": 30.0,
    "units_ordered": 2.0
  }
}
```

</details>

## Context

Projected currency values on context are in major units (15.27). Raw listing.data retains Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

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
| `hourlyConversions` | array | no |  |
| `hourlyTraffic` | array | no |  |
| `metrics` | object | no | One hour of Sponsored Products performance for one campaign. Traffic feeds carry impressions, clicks and cost; conversion feeds carry conversions, sales and unitsOrdered. Read defensively: which keys are present depends on the stream type. |
| `metrics.conversions` | number | no |  |
| `metrics.dataset` | string | no | Which feed produced it: "sp-traffic" or "sp-conversion". |
| `metrics.hour` | string | no | The hour this summary covers, ISO 8601. Not the time it was delivered. |
| `metrics.records` | number | no | How many raw feed rows were rolled up into this summary. |
| `metrics.sales` | number | no | Attributed sales for the hour. Conversion feeds only. |
| `metrics.unitsOrdered` | number | no |  |
| `mutations` | array | no | Mutation outbox array. Listing writes require a non-empty patches array of native Amazon operations. Flat fields such as price, floor and quantity are not accepted; use update_listing to change the local enabled switch. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
