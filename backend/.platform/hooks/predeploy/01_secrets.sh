#!/usr/bin/env bash
set -euo pipefail

# Load secrets from AWS Secrets Manager and SSM Parameter Store
SECRET_ID="/minmin/backend/production"
PARAMS=(/minmin/backend/EXAMPLE_PARAM)

if command -v jq >/dev/null 2>&1; then
  aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text \
    | jq -r 'to_entries|map("export " + .key + "=" + @sh .value)|.[]' >> /opt/elasticbeanstalk/support/envvars
else
  echo "jq not installed; skipping Secrets Manager load" >&2
fi

for param in "${PARAMS[@]}"; do
  value=$(aws ssm get-parameter --name "$param" --with-decryption --query Parameter.Value --output text)
  echo "export $(basename "$param")=$value" >> /opt/elasticbeanstalk/support/envvars
done
