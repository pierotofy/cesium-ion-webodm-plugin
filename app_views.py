import json
import requests

from django import forms
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from .globals import ION_API_URL


class TokenForm(forms.Form):
    token = forms.CharField(
        label="",
        required=False,
        max_length=1024,
        widget=forms.TextInput(attrs={"placeholder": "Token"}),
    )


def JsonResponse(dictionary):
    return HttpResponse(json.dumps(dictionary), content_type="application/json")


def HomeView(plugin):
    @login_required
    def view(request):
        ds = plugin.get_user_data_store(request.user)

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
            plugin.template_path("app.html"),
            {"title": "Cesium ion", "form": form},
        )

    return view


def LoadButtonView(plugin):
    def load_buttons_callback(request):
        if request.user.is_authenticated:
            ds = plugin.get_user_data_store(request.user)
            token = ds.get_string("token")
            if len(token) <= 0:
                return False

            return {
                "token": token,
                "app_name": plugin.get_name(),
                "api_url": plugin.public_url("").rstrip("/"),
                "ion_url": ION_API_URL,
            }
        else:
            return False

    return plugin.get_dynamic_script("templates/load_buttons.js", load_buttons_callback)
