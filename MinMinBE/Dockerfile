# syntax=docker/dockerfile:1
# Python base
FROM python:3.12-slim

# App/env settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps commonly needed by Django stacks
# - build-essential/gcc: compile native wheels if needed
# - libpq-dev: psycopg2 (non-binary) / Postgres client headers
# - libjpeg + zlib: Pillow
# - libffi-dev: cryptography and friends
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    libpq-dev \
    libjpeg62-turbo-dev zlib1g-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Upgrade pip tooling early
RUN python -m pip install --upgrade pip setuptools wheel

# Copy dependency file first for layer caching
COPY requirements.txt .

# If you use psycopg2, prefer psycopg2-binary in requirements to avoid building
# Install Python deps (verbose helps when debugging CI failures)
RUN pip install -v -r requirements.txt

# Copy the rest of the app
COPY . .

# (Optional) collect static at build, if you bake assets into the image
# RUN python manage.py collectstatic --noinput

# Non-root user for security
RUN useradd -m appuser
USER appuser

EXPOSE 8000


# Gunicorn defaults; adjust workers/threads based on CPU
CMD ["gunicorn", "minmin.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]

