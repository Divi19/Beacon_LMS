#!/usr/bin/env bash
set -o errexit

# Move into Django service directory
cd Backend/Framework

# Install dependencies (prefer repo root requirements.txt if present)
if [ -f "../../requirements.txt" ]; then
  pip install -r ../../requirements.txt
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
else
  echo "requirements.txt not found"; exit 1
fi

# Collect static assets
python manage.py collectstatic --no-input

# Apply migrations
python manage.py migrate
