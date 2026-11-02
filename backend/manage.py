#!/usr/bin/env python
import os
import sys

if os.name == "nt":
    os.environ["PROJ_DATA"] = r"C:\OSGeo4W\share\proj"
    os.environ["PROJ_LIB"] = r"C:\OSGeo4W\share\proj"
    
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
from django.core.management import execute_from_command_line

execute_from_command_line(sys.argv)
