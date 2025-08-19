# syntax=docker/dockerfile:1
FROM python:3.13-slim
ARG DEBIAN_FRONTEND=noninteractive

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    GDAL_DATA=/usr/share/gdal \
    PROJ_LIB=/usr/share/proj

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    libpq-dev postgresql-client \
    libjpeg62-turbo-dev zlib1g-dev \
    libffi-dev \
    gdal-bin libgdal-dev libgeos-dev \
    proj-bin proj-data \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python -m pip install --upgrade pip setuptools wheel

COPY requirements.txt .
# requirements.txt should include:
# Django>=4.2
# psycopg[binary]>=3.1
# Pillow
RUN pip install -v -r requirements.txt && pip install --no-cache-dir gunicorn

COPY . .

RUN useradd -m appuser && chown -R appuser:appuser /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh && chown appuser:appuser /entrypoint.sh

USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "minminbe.wsgi:application", "-b", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--timeout", "60"]
