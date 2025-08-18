# backend/dockerfile
# syntax=docker/dockerfile:1

FROM python:3.13-slim as builder
WORKDIR /app
COPY src/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

FROM python:3.11-slim
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /usr/local /usr/local
COPY src/ ./
USER app

# Default port; can be overridden by EB env var
ENV PORT=8000

# Use a literal number here; EXPOSE doesn’t reliably expand env vars
EXPOSE 8000

# HEALTHCHECK uses shell form, so $PORT expansion works
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:$PORT/healthz || exit 1

# IMPORTANT: use shell so $PORT expands
CMD ["sh","-c","gunicorn minminbe.wsgi:application --bind 0.0.0.0:$PORT"]
