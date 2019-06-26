import logging
import requests
from enum import Enum

from app.plugins.views import TaskView
from app.plugins.worker import task
from app.plugins import logger

from django.utils.translation import ugettext_lazy as _
from rest_framework.fields import ChoiceField, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers

from .globals import PROJECT_NAME, ION_API_URL

pluck = lambda dict, *args: (dict[arg] for arg in args)

###                        ###
#          LOGGING          #
###                        ###
class LoggerAdapter(logging.LoggerAdapter):
    def __init__(self, prefix, logger):
        super().__init__(logger, {})
        self.prefix = prefix

    def process(self, msg, kwargs):
        return "[%s] %s" % (self.prefix, msg), kwargs


###                        ###
#         API UTILS          #
###                        ###
def get_key_for(task_id, key, ds=None):
    if ds is None:
        ds = GlobalDataStore(PROJECT_NAME)
    return "task_{}_{}".format(str(task_id), key)


def set_task_info(task_id, json, ds=None):
    if ds is None:
        ds = GlobalDataStore(PROJECT_NAME)
    return ds.set_json(get_key_for(task_id, "info"), json)


def get_task_info(task_id, default=None, ds=None):
    if default is None:
        default = {"sharing": False, "shared": False, "error": ""}
    if ds is None:
        ds = GlobalDataStore(PROJECT_NAME)
    return ds.get_json(get_key_for(task_id, "info"), default)


###                        ###
#      MODEL CONFIG          #
###                        ###
class AssetType(str, Enum):
    ORTHOPHOTO = "ORTHOPHOTO"
    TERRAIN_MODEL = "TERRAIN_MODEL"
    SURFACE_MODEL = "SURFACE_MODEL"
    POINTCLOUD = "POINTCLOUD"
    TEXTURED_MODEL = "TEXTURED_MODEL"


class SourceType(str, Enum):
    RASTER_IMAGERY = "RASTER_IMAGERY"
    RASTER_TERRAIN = "RASTER_TERRAIN"
    TERRAIN_DATABASE = "TERRAIN_DATABASE"
    CITYGML = "CITYGML"
    KML = "KML"
    CAPTURE = "3D_CAPTURE"
    MODEL = "3D_MODEL"
    POINTCLOUD = "POINT_CLOUD"


class OutputType(str, Enum):
    IMAGERY = "IMAGERY"
    TILES = "3D_TILE"
    TERRAIN = "TERRAIN"


ASSET_TO_FILE = {
    AssetType.ORTHOPHOTO: "orthophoto.tif",
    AssetType.TERRAIN_MODEL: "dtm.tif",
    AssetType.SURFACE_MODEL: "dsm.tif",
    AssetType.POINTCLOUD: "georeferenced_model.laz",
    AssetType.TEXTURED_MODEL: "textured_model.zip",
}

FILE_TO_ASSET = dict([reversed(i) for i in ASSET_TO_FILE.items()])

ASSET_TO_OUTPUT = {
    AssetType.ORTHOPHOTO: OutputType.IMAGERY,
    AssetType.TERRAIN_MODEL: OutputType.TERRAIN,
    AssetType.SURFACE_MODEL: OutputType.TERRAIN,
    AssetType.POINTCLOUD: OutputType.TILES,
    AssetType.TEXTURED_MODEL: OutputType.TILES,
}

ASSET_TO_SOURCE = {
    AssetType.ORTHOPHOTO: SourceType.RASTER_TERRAIN,
    AssetType.TERRAIN_MODEL: SourceType.RASTER_TERRAIN,
    AssetType.SURFACE_MODEL: SourceType.RASTER_TERRAIN,
    AssetType.POINTCLOUD: SourceType.POINTCLOUD,
    AssetType.TEXTURED_MODEL: SourceType.CAPTURE,
}

###                        ###
#         API VIEWS          #
###                        ###
class EnumField(ChoiceField):
    default_error_messages = {"invalid": _("No matching enum type.")}

    def __init__(self, **kwargs):
        self.enum_type = kwargs.pop("enum_type")
        choices = [enum_item.value for enum_item in self.enum_type]
        self.choice_set = set(choices)
        super(EnumField, self).__init__(choices, **kwargs)

    def to_internal_value(self, data):
        if data in self.choice_set:
            return self.enum_type[data]
        self.fail("invalid")

    def to_representation(self, value):
        if not value:
            return None
        return value.value


class UploadSerializer(serializers.Serializer):
    token = CharField(help_text="Cesium ion Token")
    name = CharField(help_text="Title of the exported project for ion")
    asset_type = EnumField(enum_type=AssetType)
    description = CharField(help_text="general overview for ion", default="")
    attribution = CharField(help_text="project creator for ion", default="")


class ShareTaskView(TaskView):
    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        available_assets = []
        output = {"available": available_assets, "exported": []}
        for file_name in task.available_assets:
            if file_name not in FILE_TO_ASSET:
                continue
            available_assets.append(FILE_TO_ASSET[file_name])

        return Response(output, status=status.HTTP_200_OK)

    def post(self, request, pk=None):
        task = self.get_and_check_task(request, pk)

        serializer = UploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload_info = pluck(
            serializer.validated_data,
            "token",
            "asset_type",
            "name",
            "description",
            "attribution",
        )
        asset_path = task.get_asset_download_path(ASSET_TO_FILE[upload_info.asset_type])

        upload_to_ion(task.id, *upload_info)


###                        ###
#       CELERY TASK(S)       #
###                        ###
@task
def upload_to_ion(
    task_id, token, asset_type, asset_path, name, description="", attribution=""
):
    task_info = get_task_info(task_id)
    task_logger = LoggerAdapter(prefix=f"Task {task_id}", logger=logger)

    try:
        import boto3
    except ImportError:
        import subprocess

        task_logger.info(f"Manually installing boto3...")
        subprocess.call([sys.executable, "-m", "pip", "install", "boto3"])
        import boto3

    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "name": name,
            "description": description,
            "attribution": attribution,
            "type": model_type,
        }

        # Create Asset Request
        task_logger.info(f"Creating asset of type {model_type}")
        res = requests.post(f"{ION_API_URL}/v1/assets", json=data, headers=headers)
        res.raise_for_status()

        access_key, secret_key, token, endpoint, bucket, file_prefix, complete_data = pluck(
            res.json(),
            "accessKey",
            "secretAccessKey",
            "sessionToken",
            "endpoint",
            "bucket",
            "prefix",
            "onComplete",
        )

        # Upload
        task_logger.info("Upload complete")
        key = path.join(file_prefix, ASSET_TO_FILE[asset_type])
        boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=token,
        ).upload_file(file_path, Bucket=bucket, Key=key)

        # On Complete Handler
        method, url, fields = pluck(complete_data, "method", "url", "fields")
        task_logger.info("Upload complete", task_id)
        res = requests.request(method, url=url, headers=headers, data=fields)
        res.raise_for_status()
    except requests.exceptions.RequestException as e:
        task_info["error"] = str(e)
        task_logger.error(e)

    set_task_info(task_id, task_info)
