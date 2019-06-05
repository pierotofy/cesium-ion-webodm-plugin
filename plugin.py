import json

from django.dispatch import receiver
from django.http import HttpResponse
from guardian.shortcuts import get_objects_for_user, assign_perm
from rest_framework.renderers import JSONRenderer

from app.plugins import GlobalDataStore, logger
from app.plugins import PluginBase, Menu, MountPoint, UserDataStore, signals
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from nodeodm.models import ProcessingNode
from app.api.processingnodes import ProcessingNodeSerializer

from app.models import Theme
from django.contrib import admin
from django import forms

ds = GlobalDataStore("cesium-ion")


def JsonResponse(dict):
    return HttpResponse(json.dumps(dict), content_type="application/json")


class Plugin(PluginBase):
    def include_css_files(self):
        return ["font.css"]

    def include_js_files(self):
        return ["register_admin_button.js"]

    def build_jsx_components(self):
        return ["admin.jsx"]

    def app_mount_points(self):
        @login_required
        def admin(request):
            properties = {
                "title": "Lightning Network",
                "is_staff": "request.is_staff"
            }
            return render(
                request,
                self.template_path("admin.html"),
                properties,
            )

        return [
            MountPoint("admin$", admin),
        ]
