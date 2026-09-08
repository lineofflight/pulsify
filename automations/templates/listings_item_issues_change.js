function handle(event, context) {
  var payload = event.Payload;
  if (!payload) return context;

  // React here, e.g. pause ads when EnforcementActions includes
  // "SEARCH_SUPPRESSED".
  console.log(
    "Issues for " +
      payload.Sku +
      ": severities " +
      JSON.stringify(payload.Severities) +
      ", enforcement " +
      JSON.stringify(payload.EnforcementActions),
  );
  return context;
}
