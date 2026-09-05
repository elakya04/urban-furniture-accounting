// Centralized API Request Logger Middleware
// Logs HTTP method, URL, status code, duration, IP, and authenticated actor role

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;

  // Intercept finish event to log after response headers/status are committed
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

    // Extract actor information if authenticated
    const actorRole = req.role || (req.user?.role) || "ANONYMOUS";
    const actorId = req.user?.id || req.user?._id || "-";

    // Format status indicator
    let statusCategory = "INFO";
    if (statusCode >= 500) statusCategory = "ERROR";
    else if (statusCode >= 400) statusCategory = "WARN";
    else if (statusCode >= 300) statusCategory = "REDIRECT";
    else if (statusCode >= 200) statusCategory = "OK";

    console.log(
      `[${timestamp}] [${statusCategory}] [${method}] ${originalUrl} | Status: ${statusCode} | ${duration}ms | Actor: ${actorRole} (${actorId}) | IP: ${ip}`
    );
  });

  next();
};

export default requestLogger;
