import re
import json

from app.plugins import PluginBase, Menu, MountPoint, logger

from .globals import PROJECT_NAME
from .task_views import ShareTaskView
from .app_views import HomeView, AvailableTerrainView


class Plugin(PluginBase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = PROJECT_NAME

    def main_menu(self):
        return [Menu("Cesium ion", self.public_url(""), "fa-cesium fa fa-fw")]

    def include_js_files(self):
        return ["load_buttons.js"]

    def include_css_files(self):
        return ["font.css", "build/UploadButton.css"]

    def build_jsx_components(self):
        return ["UploadButton.jsx"]

    def api_mount_points(self):
        return [MountPoint("task/(?P<pk>[^/.]+)/share", ShareTaskView.as_view())]

    def app_mount_points(self):
        def load_buttons_callback(request):
            if request.user.is_authenticated:
                ds = self.get_user_data_store(request.user)
                token = ds.get_string("token")
                if len(token) <= 0:
                    return False

                return {
                    "token": token,
                    "app_name": self.get_name(),
                    "api_url": "/api%s" % self.public_url("").rstrip("/"),
                }
            else:
                return False

        return [
            MountPoint("$", HomeView(self)),
            MountPoint("terrains", AvailableTerrainView(self)),
            MountPoint(
                "load_buttons.js$",
                self.get_dynamic_script(
                    "templates/load_buttons.js", load_buttons_callback
                ),
            ),
        ]
