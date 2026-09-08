# Pulsify automations

Reference templates, sample event payloads, and TypeScript definitions for
[Pulsify](https://pulsify.dev) automations.

A Pulsify automation is a JavaScript function that Amazon events call:

```js
function handle(event, context) {
  const listing = context.listing;

  if (listing.floor == null || listing.ceiling == null) return context;

  const price = Math.max(listing.floor, Math.min(19.99, listing.ceiling));
  context.mutations.push({
    target: context.listing,
    patches: [{
      op: "replace",
      path: "/attributes/purchasable_offer",
      value: [{ our_price: [{ schedule: [{ value_with_tax: price }] }] }],
    }],
  });

  return context;
}
```

`event` is the raw Amazon notification. `context` is what Pulsify knows about the
listing, campaign, or account the event concerns, plus the `mutations` outbox array.
Every currency value on `context` is in major units (15.27).

## Install

```sh
npm install --save-dev @lineofflight/pulsify-automations
```

Version 2026.908.0. Types only — there is no runtime to import. The templates are
source you copy into an automation.

## Streams

| Code | Name | Surface | Context | Fires when |
| --- | --- | --- | --- | --- |
| [`ACCOUNT_STATUS_CHANGED`](docs/account_status_changed.md) | Account Status Changed | Seller Central | seller | Seller account health transitions (NORMAL, AT_RISK, DEACTIVATED) |
| [`AD_CHANGE`](docs/ad_change.md) | Ad Change | Amazon Ads | change | An ad is created or changes (state), in near real time |
| [`AD_GROUP_CHANGE`](docs/ad_group_change.md) | Ad Group Change | Amazon Ads | change | An ad group is created or changes (state, name, default bid), in near real time |
| [`ANY_OFFER_CHANGED`](docs/any_offer_changed.md) | Any Offer Changed | Seller Central | listing | Changes to the top 20 offers, Buy Box, or external prices for items you sell |
| [`B2B_ANY_OFFER_CHANGED`](docs/b2b_any_offer_changed.md) | B2B Any Offer Changed | Seller Central | listing | B2B offer changes for items you sell, including quantity discount pricing |
| [`BRANDED_ITEM_CONTENT_CHANGE`](docs/branded_item_content_change.md) | Branded Item Content Change | Seller Central | listing | Detail page content changes (title, bullets, description, images) for brand-owned ASINs. Brand protection and listing hijack detection. |
| [`BUDGET_USAGE`](docs/budget_usage.md) | Budget Usage | Amazon Ads | campaign or portfolio | A campaign or portfolio budget consumption crosses a 5% increment, in near real time |
| [`CAMPAIGN_CHANGE`](docs/campaign_change.md) | Campaign Change | Amazon Ads | change | A campaign is created or changes (state, name, budget), in near real time |
| [`DATA_KIOSK_QUERY_PROCESSING_FINISHED`](docs/data_kiosk_query_processing_finished.md) | Data Kiosk Query Processing Finished | Seller Central | listing | DataKiosk query has finished processing with results ready to download |
| [`DETAIL_PAGE_TRAFFIC_EVENT`](docs/detail_page_traffic_event.md) | Detail Page Traffic Event | Seller Central | seller | Hourly detail page glance views per ASIN. Requires Brand Analytics. |
| [`FBA_INVENTORY_AVAILABILITY_CHANGES`](docs/fba_inventory_availability_changes.md) | FBA Inventory Availability Changes | Seller Central | listing | FBA stock level changes across all marketplaces in a region |
| [`FBA_OUTBOUND_SHIPMENT_STATUS`](docs/fba_outbound_shipment_status.md) | FBA Outbound Shipment Status | Seller Central | seller | FBA outbound shipments transition to a notable lifecycle state (e.g. Shipped, Cancelled) |
| [`FEED_PROCESSING_FINISHED`](docs/feed_processing_finished.md) | Feed Processing Finished | Seller Central | seller | Feed submissions reach a terminal state (DONE, CANCELLED, FATAL) |
| [`FULFILLMENT_ORDER_STATUS`](docs/fulfillment_order_status.md) | Fulfillment Order Status | Seller Central | seller | Multi-Channel Fulfillment orders transition between lifecycle states (e.g. Received, Processing, Complete, Cancelled) |
| [`ITEM_SALES_EVENT_CHANGE`](docs/item_sales_event_change.md) | Item Sales Event Change | Seller Central | seller | Hourly ordered units and revenue per ASIN. Requires Brand Analytics. |
| [`LISTINGS_ITEM_ISSUES_CHANGE`](docs/listings_item_issues_change.md) | Listings Item Issues Change | Seller Central | listing | Listing issues are created, fixed, or updated |
| [`LISTINGS_ITEM_MFN_QUANTITY_CHANGE`](docs/listings_item_mfn_quantity_change.md) | Listings Item MFN Quantity Change | Seller Central | listing | Available quantity changes for MFN listings from orders, inventory updates, or cancellations |
| [`LISTINGS_ITEM_STATUS_CHANGE`](docs/listings_item_status_change.md) | Listings Item Status Change | Seller Central | listing | Listing status changes, including buyability transitions and suppressions |
| [`ORDER_CHANGE`](docs/order_change.md) | Order Change | Seller Central | listing | Order created, updated, or cancelled, enabling order-driven automations |
| [`PRICING_HEALTH`](docs/pricing_health.md) | Pricing Health | Seller Central | listing | Your offer loses Buy Box eligibility due to uncompetitive pricing |
| [`REPORT_PROCESSING_FINISHED`](docs/report_processing_finished.md) | Report Processing Finished | Seller Central | listing | A report has finished processing and is ready to download |
| [`SP_CONVERSION`](docs/sp_conversion.md) | SP Conversion | Amazon Ads | metrics | Hourly Sponsored Products attributed conversions and sales per campaign, ad group, ad, and keyword |
| [`SP_TRAFFIC`](docs/sp_traffic.md) | SP Traffic | Amazon Ads | metrics | Hourly Sponsored Products impressions, clicks, and spend per campaign, ad group, ad, and keyword |
| [`TARGET_CHANGE`](docs/target_change.md) | Target Change | Amazon Ads | change | A keyword or product target is created or changes (state, bid), in near real time |

## Layout

- `templates/` — the default handler Pulsify seeds for each stream
- `samples/` — a complete canned payload per stream, plus the shared listing fixture
- `docs/` — a reference page per stream: event paths, context fields, writers
- `index.d.ts` — context and handler types

## Generated

Everything here is generated from Pulsify's private repository and replaced
wholesale on each publish. Edits will be overwritten. Corrections belong in an
[issue](https://github.com/lineofflight/pulsify/issues).
