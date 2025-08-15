# Use Python 3.12 slim base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . ./

# Expose Django port
EXPOSE 8000

# Run the application with Gunicorn
CMD ["gunicorn", "alpha.wsgi:application", "--bind", "0.0.0.0:8000"]
