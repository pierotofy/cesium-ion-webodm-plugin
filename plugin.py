import re
import json

from django.contrib import messages
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


def JsonResponse(dict):
    return HttpResponse(json.dumps(dict), content_type="application/json")


class TokenForm(forms.Form):
    token = forms.CharField(
        label='',
        required=False,
        max_length=1024,
        widget=forms.TextInput(attrs={'placeholder': 'Token'}))


class Plugin(PluginBase):
    def main_menu(self):
        return [Menu("Cesium ion", self.public_url(""), "fa-cesium fa fa-fw")]

    def include_js_files(self):
        return ["load_buttons.js"]

    def include_css_files(self):
        return ["font.css"]

    def build_jsx_components(self):
        return ["App.jsx"]

    @login_required
    def home_view(self, request):
        ds = self.get_user_data_store(request.user)

        # if this is a POST request we need to process the form data
        if request.method == 'POST':
            form = TokenForm(request.POST)
            if form.is_valid():
                ds.set_string('token', form.cleaned_data['token'])
                messages.success(request, 'Token updated.')

        form = TokenForm(initial={'token': ds.get_string('token', default="")})

        return render(request, self.template_path("app.html"), {
            'title': 'Cesium ion',
            'form': form
        })

    def app_mount_points(self):
        def load_buttons_callback(request):
            if request.user.is_authenticated:
                ds = self.get_user_data_store(request.user)
                token = ds.get_string('token')
                if token == '':
                    return False

                return {'token': token}
            else:
                return False

        return [
            MountPoint("$", self.home_view),
            MountPoint(
                'load_buttons.js$',
                self.get_dynamic_script('load_buttons.js',
                                        load_buttons_callback))
        ]
