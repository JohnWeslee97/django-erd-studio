from django.core.management.base import BaseCommand
from django_erd_studio.cli import main
from django.utils import autoreload

class Command(BaseCommand):
    help = 'Starts the interactive ER diagram studio for your Django project'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Django ER Studio with Auto-Reload...'))
        autoreload.run_with_reloader(main)
