# Budget Usage

`BUDGET_USAGE` · Amazon Ads · campaign or portfolio context

A campaign or portfolio budget consumption crosses a 5% increment, in near real time.

[Amazon's documentation](https://advertising.amazon.com/API/docs/en-us/amazon-marketing-stream/data-guide)

## Default template

Pauses campaigns or sends alerts when advertising budget consumption crosses your designated threshold.

```js
// Budget-usage automation. Fires when a campaign or portfolio budget consumption
// crosses a 5% increment. `context.campaign` is present for campaign-scoped
// alerts; `context.portfolio` is present for portfolio-scoped alerts.
// `context.budget` carries the figures from this event.
function handle(event, context) {
  const usage = context.budget.usagePercentage;

  // Portfolio budgets are read-only: alert, don't act.
  if (context.portfolio) {
    console.log(`Portfolio ${context.portfolio.name} at ${usage}% of budget`);
    return context;
  }

  const campaign = context.campaign;

  // Pause the campaign once it has spent 90% of its daily budget.
  if (campaign && usage >= 90 && campaign.state === "enabled") {
    context.mutations.push({
      target: campaign,
      action: "update",
      payload: { state: "PAUSED" },
    });
  }

  return context;
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A live event carries only the fields that changed. This fixture is complete.

| Path | Type | Example |
| --- | --- | --- |
| `advertiser_id` | string | `ENTITY1234567890` |
| `advertising_product_type` | string | `sp` |
| `budget` | number | `50.0` |
| `budget_scope_id` | string | `11111` |
| `budget_scope_type` | string | `CAMPAIGN` |
| `budget_usage_percentage` | number | `92.5` |
| `marketplace_id` | string | `ATVPDKIKX0DER` |
| `notificationType` | string | `BUDGET_USAGE` |
| `profile_id` | number | `888888888` |
| `usage_updated_timestamp` | string | `2026-06-06T12:00:00Z` |

<details>
<summary>Sample payload</summary>

```json
{
  "notificationType": "BUDGET_USAGE",
  "profile_id": 888888888,
  "marketplace_id": "ATVPDKIKX0DER",
  "advertiser_id": "ENTITY1234567890",
  "budget_scope_id": "11111",
  "budget_scope_type": "CAMPAIGN",
  "advertising_product_type": "sp",
  "budget": 50.0,
  "budget_usage_percentage": 92.5,
  "usage_updated_timestamp": "2026-06-06T12:00:00Z"
}
```

</details>

## Context

Projected currency values on context are in major units (15.27). Raw data snapshots retain Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `advertisingProfiles` | array | no | The advertising profiles create_campaign may target: on a listing, the account's profiles in the listing's marketplace; on a campaign or portfolio, its own profile. Empty when the account has no Ads connection there. |
| `advertisingProfiles[].countryCode` | string | no | Two-letter country of the profile's marketplace. A new campaign's countries and marketplaces, when given, must name only this. |
| `advertisingProfiles[].currencyCode` | string | no | Currency of every budget and bid under this profile. Native Ads money uses major units. |
| `advertisingProfiles[].id` | string | no | Pulsify's local advertising profile id. With type, it names this profile as a mutation target. |
| `advertisingProfiles[].marketplaceId` | string | no |  |
| `advertisingProfiles[].mutations` | array | no | Campaign creations requested on this profile: every queued, submitting and uncertain request, plus the latest settled receipt of each attempted creation. Read created for the new campaign. |
| `advertisingProfiles[].mutations[].accepted` | boolean | no | True once Amazon confirmed the creation, false when it rejected it or reconciliation found nothing, null while the result is unknown. |
| `advertisingProfiles[].mutations[].action` | string | no |  |
| `advertisingProfiles[].mutations[].created` | object | no | The entity this creation produced, once Amazon confirmed it; null until then and for every update or archive. Its type and id are a valid mutation target, so the next step of a launch can target it directly. |
| `advertisingProfiles[].mutations[].created.id` | string | no | Pulsify's local id of the created entity. Null in the rare case Amazon returned a shape Pulsify could not store; the next sync adds it. |
| `advertisingProfiles[].mutations[].created.providerId` | string | no | Amazon's id of the created entity. |
| `advertisingProfiles[].mutations[].created.type` | string | no | Campaign, AdGroup, Ad or Target. |
| `advertisingProfiles[].mutations[].createdAt` | string | no |  |
| `advertisingProfiles[].mutations[].errorMessage` | string | yes | Provider or validation error, when available. |
| `advertisingProfiles[].mutations[].httpStatus` | number | no | Provider HTTP status. A 207 container can contain a rejected result; inspect outcome. |
| `advertisingProfiles[].mutations[].id` | string | no |  |
| `advertisingProfiles[].mutations[].outcome` | string | no | accepted, rejected, retryable, blocked, uncertain, absent or unresolved. A creation whose reply was lost is never sent again: Pulsify asks Amazon what exists and settles it as accepted, as absent (nothing was created; request it again if still wanted) or as unresolved (several entities could be it). |
| `advertisingProfiles[].mutations[].payload` | object | no |  |
| `advertisingProfiles[].mutations[].reconciliation` | object | no | What reconciliation established for an uncertain creation: result, attempts, checkedAt, nextAt, candidates and cause. Empty for a request whose result was never in doubt. |
| `advertisingProfiles[].mutations[].response` | object | no |  |
| `advertisingProfiles[].mutations[].status` | string | no | "queued", "submitting", "submitted", "blocked", "uncertain" or "unresolved". Pending while queued, submitting or uncertain; an uncertain creation does not hold back other requests for its parent. "unresolved" is final: reconciliation could not tell which entity, if any, this request created. |
| `advertisingProfiles[].mutations[].submissionId` | string | no | Amazon's request id for the call that carried this request. |
| `advertisingProfiles[].mutations[].submittedAt` | string | no | ISO 8601 timestamp when the result was recorded. |
| `advertisingProfiles[].mutations[].targetId` | string | no |  |
| `advertisingProfiles[].mutations[].targetType` | string | no | Explicit type of the receipt target. For a creation this is the parent, never the created child. |
| `advertisingProfiles[].profileId` | number | no | Amazon's advertising profile id. |
| `advertisingProfiles[].type` | string | no | Explicit mutation target type. Use this object as the target of create_campaign. |
| `budget` | object | no |  |
| `budget.amount` | number | no | The budget figure carried by the firing event, not the campaign's current budget. Null outside budget-usage events. |
| `budget.scopeType` | string | no | Which half of the context you were handed: "CAMPAIGN" means context.campaign is present, "PORTFOLIO" means context.portfolio is present. Null outside budget-usage events. |
| `budget.updatedAt` | string | no | ISO 8601 event time. Null outside budget-usage events. |
| `budget.usagePercentage` | number | no | Percentage of budget consumed, 0-100. Amazon emits one per 5% increment. Null outside budget-usage events. |
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
| `campaign.negativeTargets` | array | no | Exclusions: negative keywords and negative product targets, at ad-group and campaign level. Kept apart from targets and keywords because nothing bids on them and Amazon reports no performance for them, so they carry no bid and no metrics30. Update and archive them like any target. |
| `campaign.negativeTargets[].adGroupLocalId` | string | no | Pulsify's local ad group id. Null for a campaign-level exclusion. |
| `campaign.negativeTargets[].advertisingProfileId` | string | no | Pulsify's local advertising profile id. |
| `campaign.negativeTargets[].campaignLocalId` | string | no | Pulsify's local campaign id. Every exclusion belongs to a campaign. |
| `campaign.negativeTargets[].currencyCode` | string | no | Currency of the advertising profile. |
| `campaign.negativeTargets[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaign.negativeTargets[].id` | string | no |  |
| `campaign.negativeTargets[].level` | string | no | Amazon's targetLevel: AD_GROUP or CAMPAIGN. |
| `campaign.negativeTargets[].matchType` | string | no |  |
| `campaign.negativeTargets[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaign.negativeTargets[].profileId` | number | no | Amazon's advertising profile id. |
| `campaign.negativeTargets[].state` | string | no |  |
| `campaign.negativeTargets[].targetId` | number | no |  |
| `campaign.negativeTargets[].targetType` | string | no | Amazon targeting category: keyword, product or product_category. |
| `campaign.negativeTargets[].text` | string | no | The excluded keyword or product expression. Named text here and expression in the Ads API. |
| `campaign.negativeTargets[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `campaign.profileId` | number | no | Amazon's advertising profile id. |
| `campaign.state` | string | no |  |
| `campaign.targetingType` | string | no |  |
| `campaign.targets` | array | no | Every positive targeting category: keywords, automatic and product targets. Exclusions are in negativeTargets. |
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
| `hourlyConversions` | array | no |  |
| `hourlyConversions[].conversions` | number | no |  |
| `hourlyConversions[].hour` | string | no |  |
| `hourlyConversions[].sales` | number | no |  |
| `hourlyConversions[].unitsOrdered` | number | no |  |
| `hourlyTraffic` | array | no |  |
| `hourlyTraffic[].clicks` | number | no |  |
| `hourlyTraffic[].cost` | number | no |  |
| `hourlyTraffic[].hour` | string | no |  |
| `hourlyTraffic[].impressions` | number | no |  |
| `mutations` | array | no | Mutation outbox array, drained after handle returns. Each entry is exactly { target, action, payload }. Targets carry explicit type and local id. Use context.listing, context.campaign, or their campaigns, adGroups, ads, targets or keywords arrays. Listing update payloads contain productType and a non-empty native patches array. Ads update payloads are native Sponsored Products objects; archive uses an empty payload. A creation targets the authorized parent: create_campaign an entry of advertisingProfiles, create_ad_group a campaign, create_ad an ad group, create_target an ad group or, for an exclusion, a campaign. Its payload is Amazon's native create object; Pulsify derives adProduct and the parent ID. Nothing is returned synchronously: a later run reads the parent's mutations[].created and targets it. Listing and advertising events share this contract. Use get_mutation_schema for the native schema. At most 50 requests and 100000 serialized payload bytes per run. |
| `portfolio` | object | no | Present instead of context.campaign when a portfolio budget crosses an increment. Check budget.scopeType, or the presence of this object, before reading context.campaign. |
| `portfolio.budget` | number | no | The portfolio's own budget cap, not the figure from the firing event. That one is budget.amount. Null when the portfolio has no cap set. |
| `portfolio.budgetEndDate` | string | yes | Date the budget window closes, ISO 8601. Null for an open-ended recurring budget, which is the common case, and null when the portfolio has no budget at all. |
| `portfolio.budgetPolicy` | string | no | How Amazon renews the cap, e.g. "MONTHLY_RECURRING" or "DATE_RANGE". Null when the portfolio has no budget. |
| `portfolio.budgetStartDate` | string | no | Date the budget window opens, ISO 8601 (2026-06-01). Null when the portfolio has no budget. |
| `portfolio.id` | string | no |  |
| `portfolio.inBudget` | boolean | no | Whether Amazon still considers the portfolio within its budget. Always a boolean, never null. |
| `portfolio.name` | string | no |  |
| `portfolio.portfolioId` | number | no |  |
| `portfolio.state` | string | no |  |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
