#!/usr/bin/env bash
curl -f http://localhost:${PORT:-8000}/healthz || exit 1
