import crypto from "crypto";

export const requestLogger = (req, res, next) => {
  const startHrTime = process.hrtime.bigint();
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - startHrTime;
    const latency_ms = Math.round((Number(elapsedNs) / 1e6) * 100) / 100;

    const statusCode = res.statusCode;
    const method = req.method;
    const originalUrl = req.originalUrl || req.url || "";
    const cleanPath = originalUrl.split("?")[0];

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      "127.0.0.1";

    const userId = req.contactid || req.user?._id || req.user?.id || null;
    const userRole = req.role || req.userType || req.user?.role || null;
    const userEmail = req.user?.email || null;

    let security_event = null;
    if (statusCode === 401) {
      security_event = "UNAUTHORIZED";
    } else if (statusCode === 403) {
      security_event = "FORBIDDEN";
    }

    if (cleanPath.includes("/api/auth/login")) {
      if (statusCode >= 200 && statusCode < 300) {
        security_event = "LOGIN_SUCCESS";
      } else {
        security_event = "FAILED_LOGIN";
      }
    }

    let domain = "SYSTEM";
    if (cleanPath.startsWith("/api/invoices")) domain = "INVOICES";
    else if (cleanPath.startsWith("/api/vendor-bills") || cleanPath.startsWith("/api/me")) domain = "BILLS";
    else if (cleanPath.startsWith("/api/payments")) domain = "PAYMENTS";
    else if (cleanPath.startsWith("/api/journals") || cleanPath.startsWith("/api/journal-entries")) domain = "JOURNAL";
    else if (cleanPath.startsWith("/api/sales-orders")) domain = "SALES_ORDERS";
    else if (cleanPath.startsWith("/api/purchase-orders")) domain = "PURCHASE_ORDERS";
    else if (cleanPath.startsWith("/api/products")) domain = "PRODUCTS";
    else if (cleanPath.startsWith("/api/accounts")) domain = "ACCOUNTS";
    else if (cleanPath.startsWith("/api/contacts")) domain = "CONTACTS";
    else if (cleanPath.startsWith("/api/reports")) domain = "REPORTS";
    else if (cleanPath.startsWith("/api/dashboard")) domain = "DASHBOARD";
    else if (cleanPath.startsWith("/api/budgets")) domain = "BUDGETS";
    else if (cleanPath.startsWith("/api/ledger")) domain = "LEDGER";
    else if (cleanPath.startsWith("/api/analytic-accounts")) domain = "ANALYTIC_ACCOUNTS";
    else if (cleanPath.startsWith("/api/auth")) domain = "AUTH";
    else if (cleanPath.startsWith("/api/health")) domain = "HEALTH";

    let action = "READ";
    if (cleanPath.includes("/confirm")) action = "CONFIRM";
    else if (cleanPath.includes("/cancel")) action = "CANCEL";
    else if (cleanPath.includes("/invoice")) action = "INVOICE";
    else if (cleanPath.includes("/payments")) action = "PAYMENT";
    else if (method === "POST") action = "CREATE";
    else if (method === "PATCH" || method === "PUT") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";

    let level = "info";
    if (statusCode >= 500) {
      level = "error";
    } else if (statusCode >= 400) {
      level = "warn";
    }

    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      service: "urban-furniture-backend",
      log_type: "api_request",
      request_id: requestId,
      method,
      url: originalUrl,
      path: cleanPath,
      status_code: statusCode,
      status_class: `${Math.floor(statusCode / 100)}xx`,
      latency_ms,
      ip,
      user_id: userId ? String(userId) : null,
      user_role: userRole,
      user_email: userEmail,
      domain,
      action,
      security_event,
      is_error: statusCode >= 400
    };

    console.log(JSON.stringify(logPayload));
  });

  next();
};

export default requestLogger;
