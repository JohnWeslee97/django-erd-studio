import os
from flask import Flask, jsonify, send_from_directory, request


def create_app():
    # static_folder is next to this file
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    app = Flask(__name__, static_folder=static_folder)

    @app.route("/api/schema")
    def api_schema():
        try:
            from .inspector import get_full_schema
            schema = get_full_schema()
            from flask import make_response
            response = make_response(jsonify(schema))
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/apps")
    def api_apps():
        try:
            from .inspector import get_available_apps
            return jsonify(get_available_apps())
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def _get_models_path(app_label):
        from django.apps import apps
        try:
            app_config = apps.get_app_config(app_label)
            return os.path.join(app_config.path, 'models.py')
        except LookupError:
            return None

    def _prepare_fields(raw_fields):
        """Converts frontend field format to writer format, omitting redundant defaults."""
        processed = []
        for f in raw_fields:
            opts = {}
            
            # Only add if True (False is default for most)
            if f.get("null"): opts["null"] = True
            if f.get("blank"): opts["blank"] = True
            if f.get("unique"): opts["unique"] = True
            if f.get("primary_key"): opts["primary_key"] = True
            
            if f.get("max_length"):
                opts["max_length"] = int(f["max_length"])
                
            if f.get("related_model"):
                opts["to"] = f["related_model"]
                if f["type"] in ["ForeignKey", "OneToOneField"]:
                    on_delete = f.get("on_delete", "CASCADE")
                    # Ensure we handle models.CASCADE format
                    opts["on_delete"] = f"models.{on_delete}" if not on_delete.startswith("models.") else on_delete
            
            if f.get("related_name"):
                opts["related_name"] = f["related_name"]
            
            if f.get("default") is not None:
                opts["default"] = f["default"]
            
            processed.append({
                "name": f["name"],
                "type": f["type"],
                "options": opts
            })
        return processed

    @app.route("/api/save-model", methods=["POST"])
    def save_model():
        try:
            data = request.json
            app_label = data.get('app')
            if not app_label:
                return jsonify({"success": False, "error": "App label missing"}), 400

            from .inspector import INTERNAL_APPS
            if app_label in INTERNAL_APPS:
                return jsonify({"success": False, "error": f"Cannot modify internal Django app '{app_label}'"}), 400

            models_path = _get_models_path(app_label)
            if not models_path:
                return jsonify({"success": False, "error": f"App '{app_label}' not found"}), 404

            from .writer import append_new_model
            fields = _prepare_fields(data.get('fields', []))
            append_new_model(models_path, data['name'], fields)
            
            return jsonify({
                "success": True, 
                "message": f"Successfully added {data['name']} to {app_label}/models.py",
                "hint": f"python manage.py makemigrations {app_label}"
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/api/update-model", methods=["POST"])
    def update_model():
        try:
            data = request.json
            app_label = data.get('app') or data.get('app_label')
            if not app_label:
                return jsonify({"success": False, "error": "App label missing"}), 400

            from .inspector import INTERNAL_APPS
            if app_label in INTERNAL_APPS:
                return jsonify({"success": False, "error": f"Cannot modify internal Django app '{app_label}'"}), 400

            models_path = _get_models_path(app_label)
            if not models_path:
                return jsonify({"success": False, "error": f"App '{app_label}' not found"}), 404

            from .writer import update_model_in_file, ModelNotFoundError
            fields = _prepare_fields(data.get('fields', []))
            
            try:
                update_model_in_file(models_path, data['name'], fields)
                return jsonify({
                    "success": True,
                    "message": f"Successfully updated {data['name']} in {app_label}/models.py",
                    "hint": f"python manage.py makemigrations {app_label}"
                })
            except ModelNotFoundError:
                # Fallback to append if requested or appropriate
                from .writer import append_new_model
                append_new_model(models_path, data['name'], fields)
                return jsonify({"success": True, "message": f"Model {data['name']} created (was not found for update)"})

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/api/delete-model", methods=["POST"])
    def delete_model():
        try:
            data = request.json
            app_label = data.get('app') or data.get('app_label')
            if not app_label:
                return jsonify({"success": False, "error": "App label missing"}), 400

            from .inspector import INTERNAL_APPS
            if app_label in INTERNAL_APPS:
                return jsonify({"success": False, "error": f"Cannot modify internal Django app '{app_label}'"}), 400

            models_path = _get_models_path(app_label)
            if not models_path:
                return jsonify({"success": False, "error": f"App '{app_label}' not found"}), 404

            from .writer import delete_model_from_file
            delete_model_from_file(models_path, data['name'])
            
            return jsonify({
                "success": True, 
                "message": f"Successfully deleted model {data['name']} from {app_label}"
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/api/delete-field", methods=["POST"])
    def delete_field():
        try:
            data = request.json
            app_label = data.get('app') or data.get('app_label')
            if not app_label:
                return jsonify({"success": False, "error": "App label missing"}), 400

            from .inspector import INTERNAL_APPS
            if app_label in INTERNAL_APPS:
                return jsonify({"success": False, "error": f"Cannot modify internal Django app '{app_label}'"}), 400

            models_path = _get_models_path(app_label)
            if not models_path:
                return jsonify({"success": False, "error": f"App '{app_label}' not found"}), 404

            from .writer import delete_field_from_model
            delete_field_from_model(models_path, data['model_name'], data['field_name'])
            
            return jsonify({
                "success": True, 
                "message": f"Successfully deleted field {data['field_name']} from {data['model_name']}"
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/api/diff-model", methods=["POST"])
    def diff_model():
        try:
            data = request.json
            app_label = data.get('app')
            models_path = _get_models_path(app_label)
            
            from .writer import get_model_diff
            fields = _prepare_fields(data.get('fields', []))
            old, new = get_model_diff(models_path, data['name'], fields)
            
            return jsonify({"success": True, "old": old, "new": new})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        # Serve static files if they exist
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            response = send_from_directory(app.static_folder, path)
        else:
            # Otherwise serve index.html (React Router)
            response = send_from_directory(app.static_folder, "index.html")
            
        # Force the browser to bypass any caching layers and always load the latest compiled build
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    return app


def run_server(port=8765):
    app = create_app()
    
    current_port = port
    max_tries = 10
    
    for i in range(max_tries):
        try:
            print(f"[*] Starting ER Workbench at http://127.0.0.1:{current_port}")
            app.run(port=current_port, debug=False, use_reloader=False)
            break
        except OSError as e:
            if "address already in use" in str(e).lower() or e.errno == 98 or e.errno == 10048:
                print(f"[!] Port {current_port} is in use, trying {current_port + 1}...")
                current_port += 1
            else:
                raise e
        except Exception as e:
            print(f"[!] Error starting server: {e}")
            break
