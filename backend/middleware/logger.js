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
    sendOtlpLog(logPayload);
    sendLokiLog(logPayload);
  });

  next();
};

const sendLokiLog = async (logPayload) => {
  if (process.env.LOKI_ENABLED !== "true") return;
  let endpoint = process.env.LOKI_URL || process.env.LOKI_ENDPOINT;
  if (!endpoint) return;

  if (!endpoint.includes("/loki/api/v1/push")) {
    endpoint = `${endpoint.replace(/\/$/, "")}/loki/api/v1/push`;
  }

  try {
    const serviceName = process.env.OTEL_SERVICE_NAME || logPayload.service || "urban-furniture-backend";
    const userId = process.env.LOKI_USER_ID || process.env.OTEL_EXPORTER_OTLP_USER_ID || "";
    const apiKey = process.env.LOKI_API_KEY || process.env.OTEL_EXPORTER_OTLP_API_KEY || "";
    const customHeaders = process.env.LOKI_HEADERS || process.env.OTEL_EXPORTER_OTLP_HEADERS || "";

    const headers = {
      "Content-Type": "application/json"
    };

    if (customHeaders) {
      customHeaders.split(",").forEach(pair => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
          headers[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
        }
      });
    } else if (userId && apiKey) {
      const authString = Buffer.from(`${userId}:${apiKey}`).toString("base64");
      headers["Authorization"] = `Basic ${authString}`;
    } else if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const timeNano = String(BigInt(Date.now()) * 1000000n);

    const lokiBody = {
      streams: [
        {
          stream: {
            service: serviceName,
            log_type: logPayload.log_type,
            domain: logPayload.domain,
            level: logPayload.level
          },
          values: [
            [timeNano, JSON.stringify(logPayload)]
          ]
        }
      ]
    };

    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(lokiBody)
    })
      .then(res => {
        if (process.env.DEBUG_OTLP === "true" || process.env.DEBUG_LOKI === "true") {
          if (res.ok) {
            console.log(`[Loki Export Success] HTTP ${res.status} -> Log pushed to Grafana Loki (${logPayload.method} ${logPayload.path})`);
          } else {
            console.error(`[Loki Export Rejected] HTTP ${res.status} ${res.statusText} -> Check LOKI_URL & credentials in .env`);
          }
        }
      })
      .catch(err => {
        if (process.env.DEBUG_OTLP === "true" || process.env.DEBUG_LOKI === "true") {
          console.error("[Loki Exporter Error]", err.message);
        }
      });
  } catch (err) {
    // Non-blocking catch
  }
};

const severityNumberMap = {
  info: 9,
  warn: 13,
  error: 17,
  debug: 5
};

const sendOtlpLog = async (logPayload) => {
  if (process.env.OTEL_EXPORTER_OTLP_ENABLED !== "true") return;
  let endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  if (endpoint.endsWith("/otlp")) {
    endpoint = `${endpoint}/v1/logs`;
  } else if (!endpoint.includes("/v1/logs") && !endpoint.includes("/api/v1/push")) {
    endpoint = `${endpoint.replace(/\/$/, "")}/v1/logs`;
  }

  try {
    const serviceName = process.env.OTEL_SERVICE_NAME || logPayload.service || "urban-furniture-backend";
    const userId = process.env.OTEL_EXPORTER_OTLP_USER_ID || "";
    const apiKey = process.env.OTEL_EXPORTER_OTLP_API_KEY || "";
    const customHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS || "";

    const isPlaceholder = userId.includes("<") || apiKey.includes("<") || customHeaders.includes("<");
    if (isPlaceholder) {
      if (process.env.DEBUG_OTLP === "true" && !global.hasLoggedOtlpPlaceholderWarn) {
        console.warn("[OTLP Setup Warning] OTLP is enabled, but .env still contains placeholder brackets '<...>'. Please replace <your_instance_id> and <your_password_or_token> in backend/.env with your actual Grafana Cloud credentials.");
        global.hasLoggedOtlpPlaceholderWarn = true;
      }
      return;
    }

    const headers = {
      "Content-Type": "application/json"
    };

    if (customHeaders) {
      customHeaders.split(",").forEach(pair => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
          const key = pair.substring(0, idx).trim();
          let val = pair.substring(idx + 1).trim();
          try {
            val = decodeURIComponent(val);
          } catch (e) {
            // ignore
          }
          headers[key] = val;
        }
      });
    } else if (userId && apiKey) {
      const authString = Buffer.from(`${userId}:${apiKey}`).toString("base64");
      headers["Authorization"] = `Basic ${authString}`;
    } else if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const otlpBody = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: serviceName } },
              { key: "service", value: { stringValue: serviceName } },
              { key: "environment", value: { stringValue: process.env.NODE_ENV || "development" } }
            ]
          },
          scopeLogs: [
            {
              scope: { name: "urban-furniture-logger" },
              logRecords: [
                {
                  timeUnixNano: String(BigInt(Date.now()) * 1000000n),
                  severityNumber: severityNumberMap[logPayload.level] || 9,
                  severityText: String(logPayload.level).toUpperCase(),
                  body: { stringValue: JSON.stringify(logPayload) },
                  attributes: [
                    { key: "service", value: { stringValue: serviceName } },
                    { key: "log_type", value: { stringValue: logPayload.log_type } },
                    { key: "http.method", value: { stringValue: logPayload.method } },
                    { key: "http.status_code", value: { intValue: logPayload.status_code } },
                    { key: "status_code", value: { intValue: logPayload.status_code } },
                    { key: "http.target", value: { stringValue: logPayload.url } },
                    { key: "http.path", value: { stringValue: logPayload.path } },
                    { key: "path", value: { stringValue: logPayload.path } },
                    { key: "http.latency_ms", value: { doubleValue: logPayload.latency_ms } },
                    { key: "latency_ms", value: { doubleValue: logPayload.latency_ms } },
                    { key: "domain", value: { stringValue: logPayload.domain } },
                    { key: "action", value: { stringValue: logPayload.action } },
                    { key: "user.id", value: { stringValue: logPayload.user_id || "" } },
                    { key: "user.role", value: { stringValue: logPayload.user_role || "" } },
                    { key: "security_event", value: { stringValue: logPayload.security_event || "" } },
                    { key: "is_error", value: { boolValue: Boolean(logPayload.is_error) } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(otlpBody)
    })
      .then(res => {
        if (res.ok) {
          console.log(`[OTLP EXPORT SUCCESS] HTTP ${res.status} -> Sent telemetry log to Grafana (${logPayload.method} ${logPayload.path})`);
        } else {
          console.error(`[OTLP EXPORT REJECTED] HTTP ${res.status} ${res.statusText} -> (${logPayload.method} ${logPayload.path}) Check credentials in .env`);
        }
      })
      .catch(err => {
        console.error("[OTLP EXPORTER ERROR]", err.message);
      });
  } catch (err) {
    console.error("[OTLP EXPORTER EXCEPTION]", err.message);
  }
};

export default requestLogger;

