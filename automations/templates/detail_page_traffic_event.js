function handle(event, context) {
  // No-op. Add your logic here.
  //
  // event.payload.detailPageTrafficEvents is an array of hourly traffic aggregates,
  // one per (asin, marketplaceId). Each entry has:
  //   change.asin
  //   change.marketplaceId
  //   change.glanceViews       // detail page views for this ASIN in the window
  //   change.startTime         // ISO 8601 window start
  //   change.endTime           // ISO 8601 window end
  //   change.accountId         // amzn1.merchant.o.<sellingPartnerId>
  //
  // context.selling_partner.selling_partner_id
  return context;
}
