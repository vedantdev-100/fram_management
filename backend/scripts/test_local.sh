#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export DJANGO_SETTINGS_MODULE=config.settings.test
export TEST_DATABASE_TEMPLATE=farm_test_template
python manage.py check
python manage.py makemigrations --check --dry-run
pytest -q
ruff check .
