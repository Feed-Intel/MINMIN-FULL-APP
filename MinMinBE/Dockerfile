# syntax=docker/dockerfile:1
FROM python:3.13-slim
ARG DEBIAN_FRONTEND=noninteractive

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    libpq-dev \
    libjpeg62-turbo-dev zlib1g-dev \
    libffi-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python -m pip install --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install -v -r requirements.txt && pip install --no-cache-dir gunicorn

# Copy app code
COPY . .

# Create user (stay root for now to set perms on entrypoint)
RUN useradd -m appuser && chown -R appuser:appuser /app

# Copy entrypoint and set execute bit as root
COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh && chown appuser:appuser /entrypoint.sh

# Drop privileges only after perms are set
USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
     

# Gunicorn defaults; adjust workers/threads based on CPU
CMD ["gunicorn", "minminbe.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]

