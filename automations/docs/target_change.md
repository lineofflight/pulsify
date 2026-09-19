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

Projected currency values on context are in major units (15.27). Raw data snapshots retain Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `budget` | object | no |  |
| `budget.amount` | number | yes | The budget figure carried by the firing event, not the campaign's current budget. Null outside budget-usage events. |
| `budget.scopeType` | string | yes | Which half of the context you were handed: "CAMPAIGN" means context.campaign is present, "PORTFOLIO" means context.portfolio is present. Null outside budget-usage events. |
| `budget.updatedAt` | string | yes | ISO 8601 event time. Null outside budget-usage events. |
| `budget.usagePercentage` | number | yes | Percentage of budget consumed, 0-100. Amazon emits one per 5% increment. Null outside budget-usage events. |
| `campaign` | object | no |  |
| `campaign.adGroups` | array | no |  |
| `campaign.adGroups[].adGroupId` | number | no |  |
| `campaign.adGroups[].advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.adGroups[].asinCount` | number | no | Distinct ASINs advertised in the ad group. |
| `campaign.adGroups[].campaignLocalId` | string | no |  |
| `campaign.adGroups[].currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaign.adGroups[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.adGroups[].defaultBid` | string | no | Decimal string rather than a number ("0.75"). parseFloat before comparing. |
| `campaign.adGroups[].id` | string | no |  |
| `campaign.adGroups[].metrics30` | object | no |  |
| `campaign.adGroups[].metrics30.acos` | number | no | cost / sales over the trailing 30 days. Null when sales is zero. |
| `campaign.adGroups[].metrics30.clicks` | number | no |  |
| `campaign.adGroups[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `campaign.adGroups[].metrics30.impressions` | number | no |  |
| `campaign.adGroups[].metrics30.roas` | number | no | sales / cost over the trailing 30 days. Null when cost is zero. |
| `campaign.adGroups[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `campaign.adGroups[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.adGroups[].name` | string | no |  |
| `campaign.adGroups[].profileId` | number | no | Amazon's advertising profile id. |
| `campaign.adGroups[].state` | string | no |  |
| `campaign.adGroups[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `campaign.adProduct` | string | no |  |
| `campaign.ads` | array | no |  |
| `campaign.ads[].adGroupLocalId` | string | no |  |
| `campaign.ads[].adId` | number | no |  |
| `campaign.ads[].advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.ads[].asin` | string | no |  |
| `campaign.ads[].currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaign.ads[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.ads[].id` | string | no |  |
| `campaign.ads[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.ads[].profileId` | number | no | Amazon's advertising profile id. |
| `campaign.ads[].sku` | string | no |  |
| `campaign.ads[].state` | string | no |  |
| `campaign.ads[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `campaign.advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.asinCount` | number | no | Distinct ASINs advertised in the campaign, not just this listing's. |
| `campaign.budget` | string | no | Daily budget in major units. A number on budget-usage events and a decimal string on entity-change events. parseFloat handles both. |
| `campaign.campaignId` | number | no |  |
| `campaign.currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaign.data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.id` | string | no | Pulsify's own id. Null when the changed campaign has not been synced yet. |
| `campaign.keywords` | array | no |  |
| `campaign.keywords[].adGroupLocalId` | string | no |  |
| `campaign.keywords[].advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.keywords[].bid` | string | no | Decimal string rather than a number ("0.85"). parseFloat before comparing. |
| `campaign.keywords[].currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaign.keywords[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.keywords[].id` | string | no |  |
| `campaign.keywords[].matchType` | string | no |  |
| `campaign.keywords[].metrics30` | object | no |  |
| `campaign.keywords[].metrics30.acos` | number | no | cost / sales over the trailing 30 days. Null when sales is zero. |
| `campaign.keywords[].metrics30.clicks` | number | no |  |
| `campaign.keywords[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `campaign.keywords[].metrics30.impressions` | number | no |  |
| `campaign.keywords[].metrics30.roas` | number | no | sales / cost over the trailing 30 days. Null when cost is zero. |
| `campaign.keywords[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `campaign.keywords[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.keywords[].profileId` | number | no | Amazon's advertising profile id. |
| `campaign.keywords[].state` | string | no |  |
| `campaign.keywords[].targetId` | number | no |  |
| `campaign.keywords[].targetType` | string | no | Amazon targeting category: keyword, auto, product or product_category. |
| `campaign.keywords[].text` | string | no | The keyword expression. Named text here and expression in the Ads API. |
| `campaign.keywords[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `campaign.metrics30` | object | no |  |
| `campaign.metrics30.acos` | number | no | cost / sales over the trailing 30 days. Null when sales is zero. |
| `campaign.metrics30.clicks` | number | no |  |
| `campaign.metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `campaign.metrics30.impressions` | number | no |  |
| `campaign.metrics30.roas` | number | no | sales / cost over the trailing 30 days. Null when cost is zero. |
| `campaign.metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `campaign.mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.name` | string | no |  |
| `campaign.profileId` | number | no | Amazon's advertising profile id. |
| `campaign.state` | string | no |  |
| `campaign.targetingType` | string | no |  |
| `campaign.targets` | array | no | All targeting categories, including keywords, automatic and product targets. |
| `campaign.targets[].adGroupLocalId` | string | no |  |
| `campaign.targets[].advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.targets[].bid` | string | no | Decimal string rather than a number ("0.85"). parseFloat before comparing. |
| `campaign.targets[].currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaign.targets[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.targets[].id` | string | no |  |
| `campaign.targets[].matchType` | string | no |  |
| `campaign.targets[].metrics30` | object | no |  |
| `campaign.targets[].metrics30.acos` | number | no | cost / sales over the trailing 30 days. Null when sales is zero. |
| `campaign.targets[].metrics30.clicks` | number | no |  |
| `campaign.targets[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `campaign.targets[].metrics30.impressions` | number | no |  |
| `campaign.targets[].metrics30.roas` | number | no | sales / cost over the trailing 30 days. Null when cost is zero. |
| `campaign.targets[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `campaign.targets[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.targets[].profileId` | number | no | Amazon's advertising profile id. |
| `campaign.targets[].state` | string | no |  |
| `campaign.targets[].targetId` | number | no |  |
| `campaign.targets[].targetType` | string | no | Amazon targeting category: keyword, auto, product or product_category. |
| `campaign.targets[].text` | string | no | The keyword expression. Named text here and expression in the Ads API. |
| `campaign.targets[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `campaign.type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
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
| `mutations` | array | no | Mutation outbox array, drained after handle returns. Each entry is exactly { target, action, payload }. Targets carry explicit type and local id. Use context.listing, context.campaign, or their campaigns, adGroups, ads, targets or keywords arrays. Listing update payloads contain productType and a non-empty native patches array. Ads update payloads are native Sponsored Products objects; archive uses an empty payload. Listing and advertising events share this contract. Use get_mutation_schema for the native schema. At most 50 requests and 100000 serialized payload bytes per run. |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
