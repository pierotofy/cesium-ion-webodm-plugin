from django import forms
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required


class TokenForm(forms.Form):
    token = forms.CharField(
        label="",
        required=False,
        max_length=1024,
        widget=forms.TextInput(attrs={"placeholder": "Token"}),
    )


def JsonResponse(dict):
    return HttpResponse(json.dumps(dict), content_type="application/json")


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


def AvailableTerrainView(plugin):
    @login_required
    def view(request):
        ds = plugin.get_user_data_store(request.user)

        # if this is a POST request we need to process the form data
        if request.method != "GET":
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
