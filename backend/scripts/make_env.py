from pathlib import Path
import secrets

root = Path(__file__).resolve().parents[1]
target = root / ".env"
if target.exists():
    raise SystemExit(".env already exists; edit it without overwriting your values.")
text = (
    (root / ".env.example")
    .read_text()
    .replace("replace-with-a-long-random-secret-before-use", secrets.token_urlsafe(64))
)
target.write_text(text)
print("Created .env. Review DATABASE_URL before migrating.")
