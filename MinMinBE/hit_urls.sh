#!/bin/bash

# ==============================
# Django Endpoint Profiler Runner
# ==============================

# Base URL of your Django app
export BASE_URL="http://127.0.0.1:8000"

# API key for authentication (header: X-API-Key)
export x-api-key="qpgKywOz.qpgKywOz.2pgUuMhLkeu7pf0hw0ZLwgf4G7CE7l9C"

# Optional: Bearer token for JWT / OAuth
export BEARER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1MDY4MDQzLCJpYXQiOjE3NTUwNjYyNDMsImp0aSI6Ijk3OGNlZWQwZTQxNDQ3OTM4ODFlMTBkMTAyNTZjYmRiIiwidXNlcl9pZCI6IjQ3ODhlM2UyLWZiNjMtNGI2Yi1iMGUxLTU2MGI0N2QyYzAyMyIsImlkIjoiNDc4OGUzZTItZmI2My00YjZiLWIwZTEtNTYwYjQ3ZDJjMDIzIiwiZW1haWwiOiJpbmZvQGZlZWQtaW50ZWwuY29tIiwiZnVsbF9uYW1lIjoiQWRtaW4iLCJ1c2VyX3R5cGUiOiJhZG1pbiIsInRlbmFudCI6bnVsbCwiYnJhbmNoIjpudWxsfQ.ZjJjdHPpqbdy_w5IKS_rFM2nPcodgOVilOhU2VVuIK8"

# Optional: Django session ID (for session auth)
# export DJANGO_SESSIONID="your-session-id"

# Request timeout in seconds
export TIMEOUT="20"

# Delay between requests (seconds)
export SLEEP_BETWEEN="0.05"

# Run the script
echo "Running endpoint profiler against $BASE_URL..."
python hit_urls.py

# Exit with Python's exit code
exit $?
