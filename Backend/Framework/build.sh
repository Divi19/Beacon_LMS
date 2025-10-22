#!/usr/bin/env bash
set -o errexit

# Always run from repo root when Render calls this file.
# We cd into the Django service dir explicitly.
cd Backend/Framework


# 1) Python dependencies
# Prefer repo-root requirements.txt
if [ -f "../../requirements.txt" ]; then
  pip install -r ../../requirements.txt
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
else
  echo "requirements.txt not found" >&2
  exit 1
fi


# 2) OPTIONAL: Build React frontend (if Node/npm available)

# Safe: this block only runs when npm is present and the frontend folder exists.
if command -v npm >/dev/null 2>&1 && [ -d "../../Frontend/beacon-react-app" ]; then
  echo "Detected Node/npm and Frontend/beacon-react-app - building React..."
  pushd ../../Frontend/beacon-react-app >/dev/null
  npm ci
  npm run build
  popd >/dev/null

  # Copy the compiled React assets into Django static BEFORE collectstatic
  mkdir -p static
  mkdir -p ../../Backend/Framework/static
  cp -R ../../Frontend/beacon-react-app/build/* ../../Backend/Framework/static/ || true
else
  echo "No npm or Frontend/beacon-react-app not found - skipping React build."
fi


# 3) Django collectstatic & migrate
python manage.py collectstatic --no-input
python manage.py migrate
