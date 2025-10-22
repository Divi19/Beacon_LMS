# Render Deployment Helper for Django

**Detected project root:** `/mnt/data/project/MA_Thursday2pm_Team1-master/Backend/Framework`
**Detected Django package:** `backend`
**ASGI present:** `True`  |  **WSGI present:** `True`

## Files created/updated
- `build.sh` — build pipeline script
- `render.yaml` — Render blueprint (creates free Postgres and the web service)
- `requirements.txt` — ensured required deps are present (gunicorn, uvicorn, dj-database-url, psycopg2-binary, whitenoise)

## Next steps (summary)
1) Commit these files to your repo (`git add build.sh render.yaml requirements.txt && git commit -m 'Render deploy config'`).
2) Update `settings.py` as per notes below (DATABASE_URL, WhiteNoise, SECRET_KEY, DEBUG/ALLOWED_HOSTS).
3) Push to GitHub/GitLab/Bitbucket and connect repo in Render → Blueprints → *New Blueprint Instance*.
4) After first deploy, open *Shell* and create an admin user: `python manage.py createsuperuser`.

## settings.py checklist
- `import os` at top; set `SECRET_KEY = os.environ.get('SECRET_KEY', default='dev-secret')`.
- `DEBUG = 'RENDER' not in os.environ`.
- ALLOWED_HOSTS: add `RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME'); if RENDER_EXTERNAL_HOSTNAME: ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)`.
- Database: `import dj_database_url` then set `DATABASES = {{'default': dj_database_url.config(default='postgresql://postgres:postgres@localhost:5432/{project_pkg or 'mysite'}', conn_max_age=600)}}`.
- Static files: add `'whitenoise.middleware.WhiteNoiseMiddleware'` **after** `SecurityMiddleware`; set `STATIC_URL = '/static/'`; when `not DEBUG`, set `STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')` and `STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'`.

## Start command used
```
python -m gunicorn backend.asgi:application -k uvicorn.workers.UvicornWorker
```

If your package name above is `UNKNOWN`, update `render.yaml` line with the correct module path: `python -m gunicorn <yourpkg>.asgi:application -k uvicorn.workers.UvicornWorker`.

**Note:** A root-level `render.yaml` has also been created which points to this `build.sh` and `cd`s into `Backend/Framework` for the start command.
