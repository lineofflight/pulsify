# Ads Report Completed

`ADS_REPORT_COMPLETED` · Pulsify · report context

A report request is finalized after artifact transfer and any scheduled ingestion.

[Pulsify documentation](/docs)

## Default template

Log the finalized report. Add your policy here.

```js
function handle(event, context) {
  if (event.result.ingestionStatus === "completed") {
    console.log("Report observations imported:", context.report.mutationId);
  }
}
```

## Event

`handle(event, context)` receives the raw notification as `event`. A finalized report receipt emitted locally by Pulsify.

| Path | Type | Example |
| --- | --- | --- |
| `artifacts` | array |  |
| `automation` | null |  |
| `kind` | string | `ads_report` |
| `mutationId` | string | `sample-report` |
| `nextPageAvailable` | boolean | `false` |
| `occurredAt` | string | `2026-09-20T12:00:00Z` |
| `operation` | string | `amazon_ads:reporting:3.0:createAsyncReport` |
| `parentMutationId` | null |  |
| `result` | object |  |
| `result.ingestionStatus` | string | `completed` |
| `result.providerJobId` | string | `sample-provider-report` |
| `result.providerStatus` | string | `DONE` |
| `result.settledAt` | string | `2026-09-20T12:00:00Z` |
| `result.state` | string | `completed` |
| `type` | string | `ADS_REPORT_COMPLETED` |

<details>
<summary>Sample payload</summary>

```json
{
  "type": "ADS_REPORT_COMPLETED",
  "mutationId": "sample-report",
  "occurredAt": "2026-09-20T12:00:00Z",
  "result": {
    "state": "completed",
    "providerStatus": "DONE",
    "providerJobId": "sample-provider-report",
    "settledAt": "2026-09-20T12:00:00Z",
    "ingestionStatus": "completed"
  },
  "operation": "amazon_ads:reporting:3.0:createAsyncReport",
  "kind": "ads_report",
  "artifacts": [],
  "automation": null,
  "parentMutationId": null,
  "nextPageAvailable": false
}
```

</details>

## Context

Projected currency values on context are in major units (15.27). Raw data snapshots retain Amazon's units and types. The list_listings tool reports the same figures in minor units (1527). Never mix them. Some advertising amounts arrive as decimal strings rather than numbers; each says so, and they need parseFloat before arithmetic.

| Path | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `advertisingProfiles` | array | no | The advertising profiles create_campaign may target: on a listing, the account's profiles in the listing's marketplace; on a campaign or portfolio, its own profile. Empty when the account has no Ads connection there. |
| `advertisingProfiles[].countryCode` | string | yes | Two-letter country of the profile's marketplace. A new campaign's countries and marketplaces, when given, must name only this. |
| `advertisingProfiles[].currencyCode` | string | yes | Currency of every budget and bid under this profile. Native Ads money uses major units. |
| `advertisingProfiles[].id` | string | yes | Pulsify's local advertising profile id. With type, it names this profile as a mutation target. |
| `advertisingProfiles[].marketplaceId` | string | yes |  |
| `advertisingProfiles[].mutations` | array | no | Campaign creations requested on this profile: every queued, submitting and uncertain request, plus the latest settled receipt of each attempted creation. Read created for the new campaign. |
| `advertisingProfiles[].mutations[].accepted` | boolean | no | True once Amazon confirmed the creation, false when it rejected it or reconciliation found nothing, null while the result is unknown. |
| `advertisingProfiles[].mutations[].action` | string | no |  |
| `advertisingProfiles[].mutations[].created` | object | no | The entity this creation produced, once Amazon confirmed it; null until then and for every update or archive. Its type and id are a valid mutation target, so the next step of a launch can target it directly. |
| `advertisingProfiles[].mutations[].created.id` | string | no | Pulsify's local id of the created entity. Null in the rare case Amazon returned a shape Pulsify could not store; the next sync adds it. |
| `advertisingProfiles[].mutations[].created.providerId` | string | no | Amazon's id of the created entity. |
| `advertisingProfiles[].mutations[].created.type` | string | no | Campaign, AdGroup, Ad or Target. |
| `advertisingProfiles[].mutations[].createdAt` | string | no |  |
| `advertisingProfiles[].mutations[].errorMessage` | string | no | Provider or validation error, when available. |
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
| `advertisingProfiles[].profileId` | number | yes | Amazon's advertising profile id. |
| `advertisingProfiles[].type` | string | no | Explicit mutation target type. Use this object as the target of create_campaign. |
| `campaigns` | array | no | Observed campaigns from authorized profiles in the same account and marketplaces. |
| `campaigns[].adProduct` | string | yes |  |
| `campaigns[].advertisingProfileId` | string | yes | Pulsify's local advertising profile id. |
| `campaigns[].asinCount` | number | no | Distinct ASINs advertised in the campaign, not just this listing's. |
| `campaigns[].budget` | string | yes | Daily budget in major units, and a decimal string rather than a number ("50.0"). parseFloat before comparing. |
| `campaigns[].campaignId` | number | yes |  |
| `campaigns[].currencyCode` | string | yes | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `campaigns[].data` | object | no | Native Amazon entity, preserving original keys, values and units. Read get_mutation_schema for writable fields. |
| `campaigns[].id` | string | yes |  |
| `campaigns[].metrics30` | object | no |  |
| `campaigns[].metrics30.acos` | number | yes | cost / sales over the trailing 30 days. Null when sales is zero. |
| `campaigns[].metrics30.clicks` | number | no |  |
| `campaigns[].metrics30.cost` | number | no | Spend over the trailing 30 days. |
| `campaigns[].metrics30.impressions` | number | no |  |
| `campaigns[].metrics30.roas` | number | yes | sales / cost over the trailing 30 days. Null when cost is zero. |
| `campaigns[].metrics30.sales` | number | no | Attributed sales over the trailing 30 days. |
| `campaigns[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `campaigns[].name` | string | yes |  |
| `campaigns[].profileId` | number | yes | Amazon's advertising profile id. |
| `campaigns[].state` | string | yes |  |
| `campaigns[].targetingType` | string | yes |  |
| `campaigns[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `completeness` | object | no | Each collection selects up to 50 local rows, ordered by ID. returned and truncated describe local selection, not provider coverage. |
| `completeness.advertisingProfiles` | object | no |  |
| `completeness.advertisingProfiles.returned` | number | no |  |
| `completeness.advertisingProfiles.truncated` | boolean | no |  |
| `completeness.campaigns` | object | no |  |
| `completeness.campaigns.returned` | number | no |  |
| `completeness.campaigns.truncated` | boolean | no |  |
| `completeness.inventories` | object | no |  |
| `completeness.inventories.returned` | number | no |  |
| `completeness.inventories.truncated` | boolean | no |  |
| `completeness.listings` | object | no |  |
| `completeness.listings.returned` | number | no |  |
| `completeness.listings.truncated` | boolean | no |  |
| `connection` | object | no | The source receipt's connection and admitted marketplaces. Companion observations are restricted to the same account. |
| `connection.id` | string | no |  |
| `connection.marketplaceIds` | array | no |  |
| `connection.marketplaceIds[]` | string | no |  |
| `connection.type` | string | no |  |
| `inventories` | array | no | Authorized inventories in scope. Vendor contexts may have none. |
| `inventories[].id` | string | no |  |
| `inventories[].marketplaceId` | string | no |  |
| `inventories[].type` | string | no |  |
| `listings` | array | no | Observed listings in scope, with native data and current receipts. Nested Ads collections are empty; use context.campaigns and context.advertisingProfiles. A bounded selection may be truncated. |
| `listings[].adGroups` | array | no |  |
| `listings[].ads` | array | no |  |
| `listings[].asin` | string | no |  |
| `listings[].b2bPrice` | number | yes | Null when the listing has no B2B offer. |
| `listings[].b2bUnitsSold` | number | no | Trailing 30 days, rolled up eagerly. Always a number: zero rather than absent with no B2B sales. |
| `listings[].blocked` | boolean | no |  |
| `listings[].buyable` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listings[].campaigns` | array | no |  |
| `listings[].ceiling` | number | yes | Upper price bound as Amazon last reported it. Null when unset. Same lifecycle as floor. |
| `listings[].condition` | string | yes | Family of conditionType: new, used, collectible, refurbished or club. Null until Amazon reports it. |
| `listings[].conditionType` | string | yes | Amazon's full condition token, such as used_very_good. Null until the listing item reports it. |
| `listings[].currencyCode` | string | no | Currency of the listing marketplace or advertising profile. Native Ads money uses major units. |
| `listings[].data` | object | no | Raw Amazon source snapshots, with original keys and units. Contents vary with the sources received; missing sources are absent. FBA report stock is under data.fba.inventory (afn-fulfillable-quantity, afn-inbound-shipped-quantity, etc.). Submitted MFN stock is under data.listings_item.attributes.fulfillment_availability; observed availability is under data.listings_item.fulfillmentAvailability. data.notifications holds the latest accepted envelope of each type, including EventTime. Notifications do not overwrite report or crawl snapshots. Choose the source and stock measure your automation needs. |
| `listings[].deals` | array | yes | Coupons and promotions covering this listing's ASIN whose dates include now, as of dealsReportedAt. Null until both the coupon and promotion reports have synced, so null means unknown, not none. An empty array means both synced and nothing is active. A deal that started and ended between syncs never appears. |
| `listings[].dealsReportedAt` | string | yes | ISO 8601 time when both reports last synced (the older of the two types' latest downloads). A deal missing from deals is missing as of this time. It does not say how current each deal's totals are: read the deal's own reportedAt. Null while deals is null. |
| `listings[].deals[].data` | object | no | Amazon's report entry with its keys unchanged. A coupon carries its budget and redemption totals; a promotion carries status, type and per-ASIN sales. asins or includedProducts keeps only this listing's ASIN. Totals are cumulative through the day before the last sync. Read status yourself: dates alone do not say whether Amazon cancelled a promotion. |
| `listings[].deals[].endsAt` | string | no | ISO 8601, UTC. A deal counts as active while startsAt <= now < endsAt, but Amazon can end one earlier (a budget runs out, or it is cancelled) before the next sync. |
| `listings[].deals[].id` | string | no |  |
| `listings[].deals[].kind` | string | no |  |
| `listings[].deals[].reportedAt` | string | no | ISO 8601, UTC. When this deal's own totals in data were last refreshed from Amazon's report. A deal that started long ago in an older quarter refreshes less often than dealsReportedAt, so read this to judge how current its totals are. |
| `listings[].deals[].startsAt` | string | no |  |
| `listings[].deleted` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listings[].discoverable` | boolean | yes | Null while statuses is null. Do not read a null as false. |
| `listings[].fba` | object | yes | FBA inventory and planning report data, camelCased from Amazon's hyphenated report columns. Null for MFN listings. Keys vary by report, so treat anything below it as optional. |
| `listings[].fba.agedInventory` | object | no | Unit counts per age bucket, as decimal strings. |
| `listings[].fba.agedInventory.invAge0To90Days` | string | no |  |
| `listings[].fba.agedInventory.invAge181To270Days` | string | no |  |
| `listings[].fba.agedInventory.invAge271To365Days` | string | no |  |
| `listings[].fba.agedInventory.invAge365PlusDays` | string | no |  |
| `listings[].fba.agedInventory.invAge91To180Days` | string | no |  |
| `listings[].fba.inventory` | object | no | Quantities arrive as decimal strings, not numbers. parseInt before arithmetic. |
| `listings[].fba.inventory.afnFulfillableQuantity` | string | no |  |
| `listings[].fba.inventory.afnInboundShippedQuantity` | string | no |  |
| `listings[].fba.inventory.afnResearchingQuantity` | string | no |  |
| `listings[].fba.inventory.afnReservedQuantity` | string | no |  |
| `listings[].fba.inventory.afnTotalQuantity` | string | no |  |
| `listings[].fba.inventory.afnUnsellableQuantity` | string | no |  |
| `listings[].fba.inventory.afnWarehouseQuantity` | string | no |  |
| `listings[].fba.planning` | object | no | Restock planning figures, as decimal strings. |
| `listings[].fba.planning.available` | string | no |  |
| `listings[].fba.planning.estimatedExcessQuantity` | string | no |  |
| `listings[].fba.planning.sellThrough` | string | no |  |
| `listings[].fba.planning.unitsShippedT90` | string | no |  |
| `listings[].fba.planning.weeksOfCoverT90` | string | no |  |
| `listings[].fc` | object | yes | Fulfillment-centre report data. Null when no report has landed. Keys vary by report. |
| `listings[].fc.shelfLife` | object | no |  |
| `listings[].fc.shelfLife.unit` | string | no |  |
| `listings[].fc.shelfLife.value` | number | no |  |
| `listings[].floor` | number | yes | Lower price bound as Amazon last reported it. Null when unset. A bound you set goes to Amazon and shows here once Amazon's next reading reflects it; until then list_listings lists it under mutations. |
| `listings[].fulfillmentChannel` | string | no | Either "Amazon" (FBA) or "Merchant" (MFN). Never null. |
| `listings[].handlingTime` | number | yes | Business days from order to ship (Amazon's lead_time_to_ship_max_days). Null when the SKU uses the account's default handling time. Writable on listings you fulfil yourself. A write queues only the requested handling time; it does not resend observed stock. |
| `listings[].id` | string | no |  |
| `listings[].keywords` | array | no |  |
| `listings[].mutations` | array | no | All queued, submitting and uncertain requests plus the latest terminal receipt. Acceptance is not an observed result. |
| `listings[].mutations[].accepted` | boolean | no | Whether Amazon accepted the request for processing; false when rejected. |
| `listings[].mutations[].action` | string | no |  |
| `listings[].mutations[].created` | object | no | The entity a creation produced. Always null on a listing, which supports update only. |
| `listings[].mutations[].createdAt` | string | no |  |
| `listings[].mutations[].errorMessage` | string | no | Provider or validation error, when available. |
| `listings[].mutations[].httpStatus` | number | no | Provider HTTP status. A 207 container can contain rejected or partial results; inspect outcome. |
| `listings[].mutations[].id` | string | no |  |
| `listings[].mutations[].outcome` | string | no | Provider outcome, distinct from delivery status and observed entity data. |
| `listings[].mutations[].payload` | object | no |  |
| `listings[].mutations[].reconciliation` | object | no | What reconciliation established for an uncertain creation. Always empty on a listing. |
| `listings[].mutations[].response` | object | no |  |
| `listings[].mutations[].status` | string | no | "queued", "submitting", "submitted", "blocked", or "uncertain". Uncertain work is never blindly retried. |
| `listings[].mutations[].submissionId` | string | no | Amazon's submissionId for the patch that carried this mutation. |
| `listings[].mutations[].submittedAt` | string | no | ISO 8601 timestamp when Amazon's response was recorded. |
| `listings[].mutations[].targetId` | string | no |  |
| `listings[].mutations[].targetType` | string | no | Explicit type of the receipt target. |
| `listings[].negativeTargets` | array | no | Exclusions: negative keywords and negative product targets, at ad-group and campaign level. Kept apart from targets and keywords because nothing bids on them and Amazon reports no performance for them, so they carry no bid and no metrics30. Update and archive them like any target. |
| `listings[].price` | number | yes | Major units (15.27). list_listings reports the same figure as 1527. |
| `listings[].productType` | string | yes | Amazon product type for native listing patches. Use PRODUCT when absent. |
| `listings[].restockDate` | string | yes | YYYY-MM-DD the listing is back in stock. Null when unset. Writable on listings you fulfil yourself. |
| `listings[].shipping` | number | yes | Zero when Amazon fulfils. On a listing you fulfil, null until an offer event carries your own offer; Pulsify no longer polls for it. |
| `listings[].shippingGroup` | string | yes | Merchant shipping template id, not its display name. Null until Amazon reports one; FBA listings have none. Writable on listings you fulfil yourself. |
| `listings[].statuses` | array | yes | Null until Amazon first reports listing status. Null means unknown, not empty. buyable, discoverable and deleted derive from it and are null alongside it. |
| `listings[].statuses[]` | string | no | One of "BUYABLE", "DISCOVERABLE", "DELETED". |
| `listings[].targets` | array | no | Every positive targeting category: keywords, automatic and product targets. Exclusions are in negativeTargets. |
| `listings[].type` | string | no | Explicit mutation target type. Use this object as the mutation target. |
| `mutations` | array | no | Mutation outbox array, drained after handle returns. Each entry is exactly { target, action, payload }. Targets carry explicit type and local id. Use context.listing, context.campaign, or their campaigns, adGroups, ads, targets or keywords arrays. Listing update payloads contain productType and a non-empty native patches array. Ads update payloads are native Sponsored Products objects; archive uses an empty payload. A creation targets the authorized parent: create_campaign an entry of advertisingProfiles, create_ad_group a campaign, create_ad an ad group, create_target an ad group or, for an exclusion, a campaign. Its payload is Amazon's native create object; Pulsify derives adProduct and the parent ID. Nothing is returned synchronously: a later run reads the parent's mutations[].created and targets it. Listing and advertising events share this contract. Use get_mutation_schema for the native schema. At most 50 requests and 100000 serialized payload bytes per run. |
| `report` | object | no | Finalized receipt metadata. Provider completion, artifact transfer and ingestion are separate outcomes. |
| `report.artifacts` | array | no |  |
| `report.artifacts[].byteSize` | number | yes | Verified byte count. Null until artifact transfer succeeds. |
| `report.artifacts[].charset` | string | no |  |
| `report.artifacts[].contentType` | string | yes | Verified media type. Null until artifact transfer succeeds. |
| `report.artifacts[].errorCode` | string | yes |  |
| `report.artifacts[].expiresAt` | string | yes | Artifact expiry. Null until artifact transfer succeeds. |
| `report.artifacts[].id` | string | no |  |
| `report.artifacts[].kind` | string | no |  |
| `report.artifacts[].sha256` | string | yes | Verified checksum. Null until artifact transfer succeeds. |
| `report.artifacts[].state` | string | no |  |
| `report.automation` | object | yes | Server-owned execution digest and root, parent, event, delivery and output correlation, when automation-originated. |
| `report.errorCode` | string | yes |  |
| `report.ingestionStatus` | string | yes | Scheduled ingestion status. Customer-requested artifacts are never imported automatically. |
| `report.kind` | string | no |  |
| `report.mutationId` | string | no |  |
| `report.nextPageAvailable` | boolean | no | This page has a continuation; completion does not imply the full query is complete. No token is exposed. |
| `report.operation` | string | yes | Qualified operation name. Null for adopted requests whose original payload was not retained. |
| `report.parentMutationId` | string | yes | Previous page's receipt when this request follows a query continuation. |
| `report.providerJobId` | string | yes |  |
| `report.providerStatus` | string | yes | Amazon's terminal status, distinct from local ingestion status. |
| `report.settledAt` | string | no |  |
| `report.state` | string | no |  |
| `report.transferErrorCode` | string | yes |  |
| `store` | object | no |  |
| `webhooks` | object | no | One entry per enabled webhook on the account, keyed by name. Call webhooks.<name>.post(payload); a string payload is wrapped as { text: ... }. Empty when the account has none. |

## Functions

| Path | Signature | Notes |
| --- | --- | --- |
| `store.delete` | `delete(key)` | Removes a key immediately. |
| `store.get` | `get(key)` | Per-automation key/value store. Returns null for a missing key. Values expire after 1 day. |
| `store.set` | `set(key, value)` | Persists a JSON-serializable value under a key for 1 day. |
