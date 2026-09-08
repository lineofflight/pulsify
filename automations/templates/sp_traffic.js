// Hourly Sponsored Products traffic. Fires once per campaign per hour, on
// the first delta Amazon sends for that hour. `context.metrics` is this
// hour's impressions, clicks, and spend summed across every ad group, ad,
// and keyword in the campaign. `context.hourlyTraffic` and
// `context.hourlyConversions` are the trailing 24 hours. Later restatements
// of the same hour update those rollups but do not fire again.
function handle(event, context) {
  // No action. Add your logic here.
  return context;
}
