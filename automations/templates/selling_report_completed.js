function handle(event, context) {
  if (event.result.ingestionStatus === "completed") {
    console.log("Report observations imported:", context.report.mutationId);
  }
}
