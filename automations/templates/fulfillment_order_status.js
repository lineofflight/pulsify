function handle(event, context) {
  var payload = event.Payload?.FulfillmentOrderStatusNotification;
  if (!payload) return context;

  var line =
    "Fulfillment order " +
    payload.SellerFulfillmentOrderId +
    ": " +
    payload.FulfillmentOrderStatus;
  var shipment = payload.FulfillmentShipment; // absent until a shipment exists
  if (shipment) {
    line +=
      " (shipment " +
      shipment.AmazonShipmentId +
      ": " +
      shipment.FulfillmentShipmentStatus +
      ")";
  }
  console.log(line);
  return context;
}
