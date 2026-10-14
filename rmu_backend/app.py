"""Small server-to-server API; never exposes provider or database credentials."""
import hashlib
import hmac
import json
import os
from datetime import date, datetime, timezone
import re
import logging
from . import db, pipeline

MAX_BODY = 262144


def collection_preview(payload):
    if not isinstance(payload, dict):
        raise ValueError("Expected a JSON object")
    if set(payload) - {"query", "start", "end", "mode"}:
        raise ValueError("Unexpected input fields")
    query = payload.get("query")
    if not isinstance(query, str) or not query.strip() or len(query) > 512:
        raise ValueError("Query must contain 1–512 characters")
    if any(ord(c) < 32 for c in query):
        raise ValueError("Query contains control characters")
    try:
        start = date.fromisoformat(payload["start"])
        end = date.fromisoformat(payload["end"])
    except (ValueError, TypeError, KeyError):
        raise ValueError("Use valid start and end dates")
    if start > end or end >= datetime.now(timezone.utc).date():
        raise ValueError("Use a completed date window ending before today")
    mode = payload.get("mode", "test")
    if mode not in ("test", "initial"):
        raise ValueError("Mode must be test or initial")
    return {
        "status": "preview_only",
        "provider": "x",
        "query": query.strip(),
        "start": start.isoformat(),
        "end": end.isoformat(),
        "budget_cap_usd": "2.50" if mode == "test" else "50.00",
        "execution_enabled": False,
        "collection_started": False,
        "note": "Requires provisioned storage, verified pricing and the paid-run ledger before execution.",
    }


def application(environ, start_response):
    def reply(status, data):
        body = json.dumps(data, separators=(",", ":"), default=str).encode()
        start_response(status, [("Content-Type", "application/json"),
                                ("Cache-Control", "no-store"),
                                ("X-Content-Type-Options", "nosniff"),
                                ("Content-Length", str(len(body)))])
        return [body]

    method = environ.get("REQUEST_METHOD", "GET")
    path = environ.get("PATH_INFO", "/")
    if method == "GET" and path == "/healthz":
        # Liveness only: does not imply a connected database or active collection.
        return reply("200 OK", {"service": "rmu-intelligence-demo", "status": "alive"})
    secret = os.environ.get("RMU_SERVICE_TOKEN", "")
    if len(secret) < 32:
        return reply("503 Service Unavailable", {"error": "Service authentication is not configured"})
    expected = hashlib.sha256(("Bearer " + secret).encode()).digest()
    actual = hashlib.sha256(environ.get("HTTP_AUTHORIZATION", "").encode()).digest()
    if not hmac.compare_digest(expected, actual):
        return reply("401 Unauthorized", {"error": "Service authentication required"})
    try:
        if method == "GET" and path == "/v1/status":
            result = {"stage": "storage_pipeline", "database_configured": bool(os.environ.get("DATABASE_URL")),
                      "database_verified": False, "collection_enabled": False, "inference_enabled": os.environ.get("RMU_MODEL_ENABLED")=="true" and bool(os.environ.get("OPENAI_API_KEY"))}
            if result["database_configured"]:
                result.update(db.status())
            return reply("200 OK", result)
        if method == "GET" and path == "/v1/runs":
            return reply("200 OK", {"runs": pipeline.list_runs()})
        csv_match=re.fullmatch(r"/v1/runs/([0-9a-f-]{36})/export\.csv",path)
        if method=="GET" and csv_match:
            from .exports import export_run
            export=export_run(csv_match[1])
            if export is None:return reply("404 Not Found",{'error':'Run not found'})
            start_response("200 OK",[("Content-Type","text/csv; charset=utf-8"),("Content-Disposition",'attachment; filename="'+export['filename']+'"'),("Cache-Control","no-store"),("X-Content-Type-Options","nosniff"),("X-RMU-Row-Count",str(export['rows']))])
            return [export['content']]
        match = re.fullmatch(r"/v1/runs/([0-9a-f-]{36})(?:/(fixtures|measure|collect-page|classify))?", path)
        if match and method == "GET" and match[2] is None:
            data = pipeline.get_run(match[1])
            return reply("200 OK" if data else "404 Not Found", data or {"error": "Run not found"})
        allowed_post = path in ("/v1/collection-preview", "/v1/runs", "/v1/jobs/process-one") or (match and match[2])
        if method == "POST" and allowed_post:
            if environ.get("CONTENT_TYPE", "").split(";")[0] != "application/json":
                return reply("415 Unsupported Media Type", {"error": "Use application/json"})
            size = int(environ.get("CONTENT_LENGTH") or 0)
            if size < 1 or size > MAX_BODY:
                return reply("413 Payload Too Large", {"error": "Invalid request size"})
            payload = json.loads(environ["wsgi.input"].read(size))
            if not isinstance(payload, dict):
                raise ValueError("Expected a JSON object")
            if path == "/v1/collection-preview":
                return reply("200 OK", collection_preview(payload))
            if path == "/v1/runs":
                preview = collection_preview({k: payload[k] for k in ("query", "start", "end", "mode") if k in payload})
                return reply("201 Created", pipeline.create_run(payload, preview))
            if path == "/v1/jobs/process-one":
                if set(payload)-{"run_id"}:
                    raise ValueError("Unexpected worker fields")
                return reply("200 OK", pipeline.process_one(payload.get("run_id")))
            if match[2] == "classify":
                from .model_jobs import queue
                return reply("202 Accepted", queue(match[1],payload))
            if match[2] == "fixtures":
                return reply("200 OK", pipeline.import_fixture(match[1], payload))
            if match[2] == "collect-page":
                if payload:
                    raise ValueError("Unexpected collection fields")
                from .x_collection import collect_one
                return reply("200 OK", collect_one(match[1]))
            if match[2] == "measure":
                if payload:
                    raise ValueError("Unexpected measurement fields")
                return reply("202 Accepted", pipeline.queue_measurement(match[1]))
    except pipeline.Conflict as error:
        return reply("409 Conflict", {"error": str(error)})
    except (ValueError, UnicodeError) as error:
        return reply("400 Bad Request", {"error": str(error)})
    except Exception:
        # Do not echo SQL, credentials, evidence or provider responses to a client or logs.
        logging.error("Pipeline operation failed: method=%s path=%s", method, path)
        return reply("503 Service Unavailable", {"error": "Pipeline temporarily unavailable"})
    return reply("404 Not Found", {"error": "No such endpoint"})
