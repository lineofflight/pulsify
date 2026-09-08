// Hourly Sponsored Products conversions. Fires once per campaign per hour,
// on the first delta Amazon sends for that hour. `context.metrics` is this
// hour's attributed orders, sales, and units (1-day attribution) summed
// across the campaign. `context.hourlyTraffic` and
// `context.hourlyConversions` are the trailing 24 hours. Later restatements
// of the same hour update those rollups but do not fire again.
function handle(event, context) {
  // No action. Add your logic here.
  return context;
}
