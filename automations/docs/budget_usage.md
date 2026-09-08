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
      action: "pause",
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

Every currency value on context is in major units (15.27). The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `budget` | object | no |  |
| `budget.amount` | number | no | The budget figure carried by the firing event, not the campaign's current budget. Null outside budget-usage events. |
| `budget.scopeType` | string | no | Which half of the context you were handed: "CAMPAIGN" means context.campaign is present, "PORTFOLIO" means context.portfolio is present. Null outside budget-usage events. |
| `budget.updatedAt` | string | no | ISO 8601 event time. Null outside budget-usage events. |
| `budget.usagePercentage` | number | no | Percentage of budget consumed, 0-100. Amazon emits one per 5% increment. Null outside budget-usage events. |
| `campaign` | object | no |  |
| `campaign.adProduct` | string | no |  |
| `campaign.budget` | number | no | Daily budget in major units. A number on budget-usage events and a decimal string on entity-change events. parseFloat handles both. |
| `campaign.campaignId` | number | no |  |
| `campaign.id` | string | no | Pulsify's own id. Null when the changed campaign has not been synced yet. |
| `campaign.name` | string | no |  |
| `campaign.state` | string | no |  |
| `campaign.targetingType` | string | no |  |
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
| `mutations` | array | no | Mutation outbox array. Push mutation objects here to queue changes for Amazon selling partner or ads entities. Drained by the runtime after handle returns. |
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
