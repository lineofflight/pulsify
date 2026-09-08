function handle(event, context) {
  // No-op. Add your logic here.
  //
  // event.payload.itemSalesEventChanges is an array of hourly sales aggregates,
  // one per (asin, marketplaceId). Each entry has:
  //   change.asin
  //   change.marketplaceId
  //   change.orderedUnits      // can be negative if cancellations exceeded orders
  //   change.orderedRevenue
  //   change.currencyCode
  //   change.startTime         // ISO 8601 window start
  //   change.endTime           // ISO 8601 window end
  //   change.accountId         // amzn1.merchant.o.<sellingPartnerId>
  //
  // context.selling_partner.selling_partner_id
  return context;
}
