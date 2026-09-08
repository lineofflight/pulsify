function handle(event, context) {
  var payload = event.payload?.accountStatusChangeNotification;
  if (!payload) return context;

  // currentAccountStatus: "NORMAL" | "AT_RISK" | "DEACTIVATED";
  // previousAccountStatus may be undefined.
  console.log(
    "Account status: " +
      payload.currentAccountStatus +
      " (was " +
      (payload.previousAccountStatus || "unknown") +
      ")",
  );
  return context;
}
