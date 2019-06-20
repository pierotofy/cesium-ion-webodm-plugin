import re
import json

from django import forms
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from app.plugins import PluginBase, Menu, MountPoint, logger

from .globals import PROJECT_NAME
from .api import ShareTaskView


def JsonResponse(dict):
    return HttpResponse(json.dumps(dict), content_type="application/json")


class TokenForm(forms.Form):
    token = forms.CharField(
        label="",
        required=False,
        max_length=1024,
        widget=forms.TextInput(attrs={"placeholder": "Token"}),
    )


class Plugin(PluginBase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = PROJECT_NAME

    def main_menu(self):
        return [Menu("Cesium ion", self.public_url(""), "fa-cesium fa fa-fw")]

    def include_js_files(self):
        return ["load_buttons.js"]

    def include_css_files(self):
        return ["font.css"]

    def build_jsx_components(self):
        return ["ShareButton.jsx"]

    def as_view(self):
        @login_required
        def view(request):
            ds = self.get_user_data_store(request.user)

            # if this is a POST request we need to process the form data
            if request.method == "POST":
                form = TokenForm(request.POST)
                if form.is_valid():
                    token = form.cleaned_data["token"].strip()
                    if len(token) > 0:
                        messages.success(request, "Updated Cesium ion Token!")
                    else:
                        messages.info(request, "Reset Cesium ion Token")
                    ds.set_string("token", token)

            form = TokenForm(initial={"token": ds.get_string("token", default="")})

            return render(
                request,
                self.template_path("app.html"),
                {"title": "Cesium ion", "form": form},
            )

        return view

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
            MountPoint("$", self.as_view()),
            MountPoint(
                "load_buttons.js$",
                self.get_dynamic_script(
                    "templates/load_buttons.js", load_buttons_callback
                ),
            ),
        ]
