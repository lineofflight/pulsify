// Ad-change automation. Fires when an ad is created or changes.
// `context.change` is the changed entity as Amazon sent it; `context.campaign`
// is your synced campaign when Pulsify knows it.
// Careful: changes Pulsify itself makes come back as events. Guard against
// reacting to your own mutations.
function handle(event, context) {
  // No action. Add your logic here.
  return context;
}
