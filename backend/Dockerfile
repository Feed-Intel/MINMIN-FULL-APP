# syntax=docker/dockerfile:1

FROM python:3.11-slim as builder
WORKDIR /app
COPY src/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /usr/local /usr/local
COPY src/ ./
USER app
ENV PORT=8000
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:${PORT}/healthz || exit 1
CMD ["gunicorn", "app.wsgi:application", "--bind", "0.0.0.0:${PORT}"]
