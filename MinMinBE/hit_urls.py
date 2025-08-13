# hit_urls.py
import json, os, re, sys, time
import requests
from urllib.parse import urljoin

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/") + "/"
TIMEOUT = float(os.getenv("TIMEOUT", "20"))
SLEEP_BETWEEN = float(os.getenv("SLEEP_BETWEEN", "0.05"))
BEARER = os.getenv("BEARER_TOKEN")  # optional: JWT or OAuth token
SESSIONID = os.getenv("DJANGO_SESSIONID")  # optional: Django session cookie
X_API_KEY = os.getenv("x-api-key")  # <-- Changed to match bash env var

SAMPLE_PARAMS = {
    # "api/v1/users/<int:id>/": "api/v1/users/1/",
}

# Only exercise API endpoints
INCLUDE_PREFIXES = ("api/v1/", "api/auth/", "api/")

# Sample request payloads and per-endpoint overrides.  These allow the
# profiler to hit POST/PUT endpoints with a basic JSON body or custom
# headers.  Paths should match the realised URL that will be requested.
SAMPLE_REQUESTS: dict[str, dict] = {
    "api/auth/register/": {
        "method": "post",
        "json": {
            "email": os.getenv("TEST_EMAIL", "user@example.com"),
            "password": os.getenv("TEST_PASSWORD", "Passw0rd!"),
            "user_type": "customer",
            "full_name": "Test User",
            "phone": "1234567890",
        },
        "headers": {"Content-Type": "application/json"},
    },
    "api/auth/login/": {
        "method": "post",
        "json": {
            "email": os.getenv("TEST_EMAIL", "user@example.com"),
            "password": os.getenv("TEST_PASSWORD", "Passw0rd!"),
        },
        "headers": {"Content-Type": "application/json"},
    },
    "api/auth/logout/": {"method": "post", "headers": {"Content-Type": "application/json"}},
    "api/auth/token/refresh/": {
        "method": "post",
        "json": {"refresh": os.getenv("TEST_REFRESH", "dummy-refresh")},
        "headers": {"Content-Type": "application/json"},
    },
}

def clean_pattern(p: str) -> str:
    p = p.strip()
    p = p.lstrip("^").rstrip("$")
    p = p.lstrip("/")
    p = re.sub(r"/{2,}", "/", p)
    return p

def has_params(p: str) -> bool:
    if re.search(r"<[^>]+>", p):
        return True
    if re.search(r"\(\?P<[^>]+>.*\)|\(\?:.*\)|\[\^?.*?\]", p):
        return True
    return False

def should_skip(p: str) -> bool:
    return not p.startswith(INCLUDE_PREFIXES)

def realize_param_path(p: str) -> str | None:
    if p in SAMPLE_PARAMS:
        return SAMPLE_PARAMS[p]
    p2 = re.sub(r"<int:[^>]+>", "1", p)
    p2 = re.sub(r"<slug:[^>]+>", "example-slug", p2)
    p2 = re.sub(r"<uuid:[^>]+>", "123e4567-e89b-12d3-a456-426614174000", p2)
    p2 = re.sub(r"<str:[^>]+>", "example", p2)
    p2 = re.sub(r"<[^>]+>", "1", p2)
    if re.search(r"\(\?P<[^>]+>.*\)|\(|\)|\[|\]|\^|\$", p2):
        return None
    return p2

def make_session() -> requests.Session:
    s = requests.Session()
    headers = {"Accept": "*/*"}
    if BEARER:
        headers["Authorization"] = f"Bearer {BEARER}"
    if X_API_KEY:
        headers["X-API-Key"] = X_API_KEY  # HTTP header stays Pascal-case
    s.headers.update(headers)
    if SESSIONID:
        s.cookies.set("sessionid", SESSIONID, domain="127.0.0.1")
        s.cookies.set("csrftoken", "dummy")
    return s

def load_urls(path="urls.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    data = load_urls()
    s = make_session()

    tested = 0
    ok = 0
    errors = 0
    results = []

    for entry in data:
        raw = entry.get("pattern") or ""
        p = clean_pattern(raw)
        if not p or should_skip(p):
            continue

        if has_params(p):
            p_real = realize_param_path(p)
            if not p_real:
                continue
        else:
            p_real = p

        url = urljoin(BASE, p_real)
        spec = SAMPLE_REQUESTS.get(p_real if p_real.endswith("/") else p_real + "/", {})
        method = spec.get("method", "get").lower()
        kwargs = {"timeout": TIMEOUT, "allow_redirects": False}
        if "json" in spec:
            kwargs["json"] = spec["json"]
        if "headers" in spec:
            kwargs["headers"] = spec["headers"]
        try:
            r = s.request(method, url, **kwargs)
            elapsed_ms = int(r.elapsed.total_seconds() * 1000)
            status = r.status_code
            ok += 1 if 200 <= status < 400 else 0
            tested += 1
            results.append({"url": url, "status": status, "elapsed_ms": elapsed_ms})
            print(f"{url} -> {status} ({elapsed_ms} ms)")
        except Exception as e:
            tested += 1
            errors += 1
            results.append({"url": url, "error": str(e)})
            print(f"{url} -> ERROR: {e}", file=sys.stderr)

        time.sleep(SLEEP_BETWEEN)

    print(f"\nDone. Tested={tested}, OK-ish(<400)={ok}, Errors={errors}")
    with open("hit_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved detailed results to hit_results.json")

if __name__ == "__main__":
    main()
