function handle(event, context) {
  var payload = event.Payload?.FBAOutboundShipmentStatusNotification;
  if (!payload) return context;

  // ShipmentStatus: e.g. "Shipped", "Cancelled".
  console.log(
    "Order " +
      payload.AmazonOrderId +
      " shipment " +
      payload.AmazonShipmentId +
      ": " +
      payload.ShipmentStatus,
  );
  return context;
}
