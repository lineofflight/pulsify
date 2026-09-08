// Budget-usage automation. Fires when a campaign or portfolio budget consumption
// crosses a 5% increment. `context.campaign` is present for campaign-scoped
// alerts; `context.portfolio` is present for portfolio-scoped alerts.
// `context.budget` carries the figures from this event.
function handle(event, context) {
  const usage = context.budget.usagePercentage;

  // Portfolio budgets are read-only: alert, don't act.
  if (context.portfolio) {
    console.log(`Portfolio ${context.portfolio.name} at ${usage}% of budget`);
    return context;
  }

  const campaign = context.campaign;

  // Pause the campaign once it has spent 90% of its daily budget.
  if (campaign && usage >= 90 && campaign.state === "enabled") {
    context.mutations.push({
      target: campaign,
      action: "pause",
    });
  }

  return context;
}
