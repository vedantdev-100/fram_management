FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends gdal-bin libgeos-c1v5 libproj25 libpq5 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt
RUN useradd --create-home --uid 10001 farm
COPY --chown=farm:farm . /app
RUN mkdir -p /app/media /app/staticfiles && chown -R farm:farm /app/media /app/staticfiles
USER farm
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "--access-logfile", "-"]
