import os
import sys
import json
import time
import base64
import socket
import subprocess
import urllib.request
import urllib.error

def load_env_file(filepath):
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def send_otlp_log(url, headers, service_name, log_payload):
    try:
        now_nano = str(int(time.time() * 1e9))
        status_code = int(log_payload.get("status_code", 200))
        is_error = bool(log_payload.get("is_error", status_code >= 400))
        level = str(log_payload.get("level", "info")).lower()

        otlp_payload = {
            "resourceLogs": [
                {
                    "resource": {
                        "attributes": [
                            {"key": "service.name", "value": {"stringValue": service_name}},
                            {"key": "service", "value": {"stringValue": service_name}},
                            {"key": "environment", "value": {"stringValue": "development"}}
                        ]
                    },
                    "scopeLogs": [
                        {
                            "scope": {"name": "urban-furniture-backend-shipper"},
                            "logRecords": [
                                {
                                    "timeUnixNano": now_nano,
                                    "severityNumber": 17 if is_error else 9,
                                    "severityText": level.upper(),
                                    "body": {"stringValue": json.dumps(log_payload)},
                                    "attributes": [
                                        {"key": "service", "value": {"stringValue": service_name}},
                                        {"key": "log_type", "value": {"stringValue": log_payload.get("log_type", "api_request")}},
                                        {"key": "http.method", "value": {"stringValue": log_payload.get("method", "GET")}},
                                        {"key": "http.status_code", "value": {"intValue": status_code}},
                                        {"key": "status_code", "value": {"intValue": status_code}},
                                        {"key": "path", "value": {"stringValue": log_payload.get("path", "")}},
                                        {"key": "latency_ms", "value": {"doubleValue": float(log_payload.get("latency_ms", 0.0))}},
                                        {"key": "domain", "value": {"stringValue": log_payload.get("domain", "")}},
                                        {"key": "security_event", "value": {"stringValue": log_payload.get("security_event") or ""}},
                                        {"key": "is_error", "value": {"boolValue": is_error}}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        data_bytes = json.dumps(otlp_payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        with urllib.request.urlopen(req) as resp:
            method = log_payload.get("method", "API")
            path = log_payload.get("path", "")
            print(f"  [GRAFANA LOKI SHIPPED] HTTP {resp.status} -> {method} {path} (Status: {status_code})")
            sys.stdout.flush()
    except urllib.error.HTTPError as e:
        print(f"  [GRAFANA SHIP ERROR] HTTP {e.code}: {e.reason}")
        sys.stdout.flush()
    except Exception as e:
        print(f"  [GRAFANA SHIP EXCEPTION] {e}")
        sys.stdout.flush()

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 65)
    print("[+] REAL-TIME BACKEND LOG SHIPPER TO GRAFANA LOKI / OTLP")
    print("=" * 65)
    sys.stdout.flush()

    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    env_path = os.path.join(backend_dir, ".env")
    env_vars = load_env_file(env_path)
    backend_port = int(env_vars.get("PORT", "5001"))

    # Avoid attaching requests to a different backend process than the one being shipped.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as port_check:
        port_check.settimeout(0.5)
        if port_check.connect_ex(("127.0.0.1", backend_port)) == 0:
            print(f"[!] Backend port {backend_port} is already in use.")
            print("[!] Stop the existing Node process, then run this shipper again.")
            return

    endpoint = env_vars.get("OTEL_EXPORTER_OTLP_ENDPOINT", "https://otlp-gateway-prod-ap-south-1.grafana.net/otlp")
    user_id = env_vars.get("OTEL_EXPORTER_OTLP_USER_ID", "1811543")
    api_key = env_vars.get("OTEL_EXPORTER_OTLP_API_KEY", "")
    service_name = env_vars.get("OTEL_SERVICE_NAME", "urban-furniture-backend")

    if endpoint.endswith("/otlp"):
        url = f"{endpoint}/v1/logs"
    elif not "/v1/logs" in endpoint:
        url = f"{endpoint.rstrip('/')}/v1/logs"
    else:
        url = endpoint

    auth_str = f"{user_id}:{api_key}"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {b64_auth}"
    }

    print(f"[*] Target Endpoint: {url}")
    print(f"[*] Instance ID:    {user_id}")
    print(f"[*] Service Name:   {service_name}")
    print(f"[*] Spawning Backend Process: 'node server.js' in {backend_dir}...")
    print("-" * 65)
    sys.stdout.flush()

    # Pass unbuffered environment to subprocess
    child_env = os.environ.copy()
    child_env["PYTHONUNBUFFERED"] = "1"
    child_env["FORCE_COLOR"] = "0"

    # Spawn node server.js process directly and listen to real-time stdout
    proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=backend_dir,
        env=child_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    try:
        for line in iter(proc.stdout.readline, ""):
            if not line:
                break
            line_str = line.strip()
            if not line_str:
                continue

            # Print standard output line to terminal console immediately
            print(line_str)
            sys.stdout.flush()

            # Check if line is a JSON log produced by backend logger
            if line_str.startswith("{") and line_str.endswith("}"):
                try:
                    payload = json.loads(line_str)
                    if isinstance(payload, dict) and ("service" in payload or "log_type" in payload):
                        # Transmit real-time log to Grafana OTLP / Loki immediately
                        send_otlp_log(url, headers, service_name, payload)
                except json.JSONDecodeError:
                    pass

    except KeyboardInterrupt:
        print("\n[*] Stopping backend log shipper process...")
        proc.terminate()
    finally:
        proc.wait()

if __name__ == "__main__":
    main()
