# dump_urls.py
import json
from django.conf import settings
from django.urls import get_resolver, URLPattern, URLResolver
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "YOUR_PROJECT.settings")  # <- set your settings module
django.setup()

def flatten(resolver, prefix=""):
    items = []
    for p in resolver.url_patterns:
        if isinstance(p, URLPattern):
            # Try to get a “path-like” string (Django 2+ path converters print nicely)
            pattern = prefix + str(p.pattern)
            items.append({
                "pattern": pattern.lstrip("/"),
                "name": p.name,
                "lookup_str": getattr(p, "lookup_str", None),
            })
        elif isinstance(p, URLResolver):
            items.extend(flatten(p, prefix + str(p.pattern)))
    return items

urls = flatten(get_resolver())
print(json.dumps(urls, indent=2))
