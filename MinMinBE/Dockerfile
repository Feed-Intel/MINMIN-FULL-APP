FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    gdal-bin \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn

COPY . .

# Create non-root user (UID 1000 by default) for safety
RUN useradd -m appuser && chown -R appuser:appuser /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD curl -f http://localhost:8000/healthz || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "minminbe.wsgi:application", "--bind", "0.0.0.0:8000"]
