# syntax=docker/dockerfile:1
FROM python:3.13-slim

ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ---- System deps for GeoDjango + Postgres + PIL ----
# Note: libgdal + libgeos + proj are essential for GeoDjango.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    libpq-dev \
    libjpeg62-turbo-dev zlib1g-dev \
    libffi-dev \
    gdal-bin libgdal-dev \
    libgeos-dev \
    proj-bin proj-data \
    && rm -rf /var/lib/apt/lists/*

# (Sometimes needed so GDAL/PROJ can find their data at runtime)
ENV GDAL_DATA=/usr/share/gdal \
    PROJ_LIB=/usr/share/proj

WORKDIR /app

RUN python -m pip install --upgrade pip setuptools wheel

# Install Python deps
COPY requirements.txt .
# Ensure these are present in requirements.txt:
#   Django>=4.2
#   psycopg[binary]>=3.1
#   Pillow
RUN pip install -v -r requirements.txt && pip install --no-cache-dir gunicorn

# Copy app code
COPY . .

# Create non-root user and fix ownership for runtime
RUN useradd -m appuser && chown -R appuser:appuser /app

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh && chown appuser:appuser /entrypoint.sh

USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]

# Gunicorn defaults; EB will proxy to 8000
CMD ["gunicorn", "minminbe.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]
