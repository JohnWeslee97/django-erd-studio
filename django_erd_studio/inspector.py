from typing import Any, Dict


INTERNAL_APPS = {
    'admin', 'auth', 'contenttypes', 'sessions', 
    'messages', 'staticfiles', 'django_erd_studio'
}

def get_full_schema() -> Dict[str, Any]:
    """
    Introspects all installed Django models and extracts their schema information.
    Must be called after django.setup() has been initialized.
    """
    from django.apps import apps
    from django.db import models
    
    schema = {}
    
    # Get all models registered in the Django project
    all_models = apps.get_models()
    
    for model in all_models:
        meta = model._meta
        
        # SKIP SYSTEM MODELS
        if meta.app_label in INTERNAL_APPS:
            continue

        model_id = f"{meta.app_label}.{meta.object_name}"
        
        model_data = {
            "name": meta.object_name,
            "app_label": meta.app_label,
            "db_table": meta.db_table,
            "fields": []
        }
        
        # Iterate through all fields (including ManyToMany)
        # We use get_fields() to capture all relationships correctly
        for field in meta.get_fields():
            
            # Skip reverse relations (ManyToOneRel, ForeignObjectRel, etc.)
            if not field.concrete and not isinstance(field, models.ManyToManyField):
                continue
                
            # Basic field attributes
            field_info = {
                "name": field.name,
                "type": field.__class__.__name__,
                "primary_key": getattr(field, 'primary_key', False),
                "unique": getattr(field, 'unique', False),
                "null": getattr(field, 'null', False),
                "blank": getattr(field, 'blank', False),
                "max_length": getattr(field, 'max_length', None),
            }
            
            # Extract relationship info if it exists
            if field.is_relation and field.related_model:
                # Use app_label.ModelName format for clarity in diagrams
                field_info["related_model"] = f"{field.related_model._meta.app_label}.{field.related_model._meta.object_name}"
                # Extract related_name for reverse relation visualization
                related_name = getattr(field, 'related_query_name', lambda: None)()
                if hasattr(field, 'remote_field') and field.remote_field:
                    rn = getattr(field.remote_field, 'related_name', None)
                    if rn:
                        related_name = str(rn)
                field_info["related_name"] = related_name
                # Extract on_delete for FK / O2O
                if hasattr(field, 'remote_field') and field.remote_field:
                    on_delete = getattr(field.remote_field, 'on_delete', None)
                    if on_delete:
                        field_info["on_delete"] = on_delete.__name__
            else:
                field_info["related_model"] = None
                
            model_data["fields"].append(field_info)
            
        schema[model_id] = model_data
        
    return schema


def get_available_apps() -> list:
    """Returns a list of app labels for all installed apps in the project."""
    from django.apps import apps
    return [
        app_config.label 
        for app_config in apps.get_app_configs() 
        if app_config.label not in INTERNAL_APPS
    ]

