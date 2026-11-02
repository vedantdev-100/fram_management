from django.db import migrations
from django.contrib.postgres.operations import BtreeGistExtension
from django.contrib.postgres.operations import CreateExtension


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [CreateExtension("postgis"), BtreeGistExtension()]
