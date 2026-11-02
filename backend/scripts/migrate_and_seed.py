import subprocess
import sys

for command in ("migrate", "seed_system", "collectstatic"):
    args = [sys.executable, "manage.py", command]
    if command in ("migrate", "collectstatic"):
        args.append("--noinput")
    subprocess.run(args, check=True)
