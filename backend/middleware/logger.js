// Centralized API Request Logger Middleware
// Logs HTTP method, URL, status code, duration, IP, and authenticated actor role

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;

  // Intercept finish event to log after response headers/status are committed
  const durationMs = Date.now() - startTime;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : "info",
      event: "api_request",
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      requestId,
      userId: req.contactid || null,
      role: req.role || null
    }));

  next();
};

export default requestLogger;
