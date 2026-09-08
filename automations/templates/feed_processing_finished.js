function handle(event, context) {
  var payload = event.payload?.feedProcessingFinishedNotification;
  if (!payload) return context;

  // processingStatus: "DONE" | "CANCELLED" | "FATAL".
  // payload.resultFeedDocumentId is present when results are available.
  console.log(
    "Feed " +
      payload.feedId +
      " (" +
      payload.feedType +
      "): " +
      payload.processingStatus,
  );
  return context;
}
