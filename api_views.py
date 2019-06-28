import sys
import time
import logging
import requests
from os import path
from enum import Enum

from app.plugins.views import TaskView
from app.plugins.worker import task
from app.plugins.data_store import GlobalDataStore
from app.plugins import logger

from django.utils.translation import ugettext_lazy as _
from rest_framework.fields import ChoiceField, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers

from .globals import PROJECT_NAME, ION_API_URL


pluck = lambda dic, *keys: [dic[k] if k in dic else None for k in keys]

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
def get_key_for(task_id, key):
    return "task_{}_{}".format(str(task_id), key)


def set_asset_info(task_id, asset_type, json, ds=None):
    if ds is None:
        ds = GlobalDataStore(PROJECT_NAME)
    return ds.set_json(get_key_for(task_id, asset_type.value), json)


def get_asset_info(task_id, asset_type, default=None, ds=None):
    if default is None:
        default = {
            "id": None,
            "upload": {"progress": 0, "active": False},
            "process": {"progress": 0, "active": False},
            "error": "",
        }
    if ds is None:
        ds = GlobalDataStore(PROJECT_NAME)
    return ds.get_json(get_key_for(task_id, asset_type.value), default)


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
    TILES = "3DTILES"
    TERRAIN = "TERRAIN"


ASSET_TO_FILE = {
    AssetType.ORTHOPHOTO: "orthophoto.tif",
    # AssetType.TERRAIN_MODEL: "dtm.tif",
    # AssetType.SURFACE_MODEL: "dsm.tif",
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
    AssetType.ORTHOPHOTO: SourceType.RASTER_IMAGERY,
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
        super().__init__(choices, **kwargs)

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
    description = CharField(
        help_text="general overview for ion",
        default="",
        required=False,
        allow_blank=True,
    )
    attribution = CharField(
        help_text="project creator for ion",
        default="",
        required=False,
        allow_blank=True,
    )


class ShareTaskView(TaskView):
    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)

        assets = []
        for file_name in task.available_assets:
            if file_name not in FILE_TO_ASSET:
                continue
            asset_type = FILE_TO_ASSET[file_name]

            asset_info = get_asset_info(task.id, asset_type)
            ion_id = asset_info["id"]
            is_exported = not (
                asset_info["id"] is None
                or asset_info["upload"]["active"]
                or asset_info["process"]["active"]
            )
            assets.append({"type": asset_type, "isExported": is_exported, "id": ion_id})

        return Response({"items": assets}, status=status.HTTP_200_OK)

    def post(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        serializer = UploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token, asset_type, name, description, attribution = pluck(
            serializer.validated_data,
            "token",
            "asset_type",
            "name",
            "description",
            "attribution",
        )
        asset_path = task.get_asset_download_path(ASSET_TO_FILE[asset_type])

        asset_info = get_asset_info(task.id, asset_type)
        asset_info["upload"]["active"] = True
        set_asset_info(task.id, asset_type, asset_info)

        upload_to_ion.delay(
            task.id, token, asset_type, asset_path, name, description, attribution
        )
        return Response(status=status.HTTP_200_OK)


class StatusTaskView(TaskView):
    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        active = []

        for asset_type in AssetType:
            asset_info = get_asset_info(task.id, asset_type)
            if (
                not asset_info["upload"]["active"]
                and not asset_info["process"]["active"]
                and len(asset_info["error"]) <= 0
            ):
                continue

            asset_info["type"] = asset_type
            active.append(asset_info)

        return Response({"items": active}, status=status.HTTP_200_OK)


###                        ###
#       CELERY TASK(S)       #
###                        ###
class TaskUploadProgress(object):
    def __init__(self, file_path, task_id, asset_type, logger=None):
        self._task_id = task_id
        self._asset_type = asset_type
        self._logger = logger

        self._uploaded_bytes = 0
        self._total_bytes = float(path.getsize(file_path))
        self._asset_info = get_asset_info(task_id, asset_type)

    @property
    def asset_info(self):
        return self._asset_info

    def __call__(self, total_bytes):
        self._uploaded_bytes += total_bytes
        progress = self._uploaded_bytes / self._total_bytes
        if progress == 1:
            progress = 1
            self._asset_info["upload"]["active"] = False
        else:
            self._asset_info["upload"]["progress"] = True

        self._asset_info["upload"]["progress"] = progress
        if self._logger is not None:
            self._logger.info(f"Upload progress: {progress * 100}%")

        set_asset_info(self._task_id, self._asset_type, self._asset_info)


@task
def upload_to_ion(
    task_id, token, asset_type, asset_path, name, description="", attribution=""
):
    asset_logger = LoggerAdapter(prefix=f"Task {task_id} {asset_type}", logger=logger)
    asset_type = AssetType[asset_type]
    asset_info = get_asset_info(task_id, asset_type)

    try:
        import boto3
    except ImportError:
        import subprocess

        asset_logger.info(f"Manually installing boto3...")
        subprocess.call([sys.executable, "-m", "pip", "install", "boto3"])
        import boto3

    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "name": name,
            "description": description,
            "attribution": attribution,
            "type": ASSET_TO_OUTPUT[asset_type],
            "options": {"sourceType": ASSET_TO_SOURCE[asset_type]},
        }

        # Create Asset Request
        asset_logger.info(f"Creating asset of type {asset_type}")
        res = requests.post(f"{ION_API_URL}/assets", json=data, headers=headers)
        res.raise_for_status()
        ion_info, upload_meta, on_complete = pluck(
            res.json(), "assetMetadata", "uploadLocation", "onComplete"
        )
        ion_id = ion_info["id"]
        access_key, secret_key, token, endpoint, bucket, file_prefix = pluck(
            upload_meta,
            "accessKey",
            "secretAccessKey",
            "sessionToken",
            "endpoint",
            "bucket",
            "prefix",
        )

        # Upload
        asset_logger.info("Starting upload")
        uploat_stats = TaskUploadProgress(asset_path, task_id, asset_type, asset_logger)
        key = path.join(file_prefix, ASSET_TO_FILE[asset_type])
        boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=token,
        ).upload_file(asset_path, Bucket=bucket, Key=key, Callback=uploat_stats)
        asset_info = uploat_stats.asset_info
        asset_info["id"] = ion_id
        set_asset_info(task_id, asset_type, asset_info)

        # On Complete Handler
        method, url, fields = pluck(on_complete, "method", "url", "fields")
        asset_logger.info("Upload complete")
        res = requests.request(method, url=url, headers=headers, data=fields)
        res.raise_for_status()

        # Processing Status Refresh
        asset_logger.info("Starting processing")
        refresh = True
        asset_info["process"]["active"] = True
        set_asset_info(task_id, asset_type, asset_info)
        while refresh:
            res = requests.get(f"{ION_API_URL}/assets/{ion_id}", headers=headers)
            res.raise_for_status()

            state, percent_complete = pluck(res.json(), "status", "percentComplete")
            progress = float(percent_complete) / 100
            if "ERROR" in state.upper():
                asset_info["error"] = f"Processing failed"
                asset_logger.info("Processing failed...")
                refresh = False
            if progress >= 1:
                refresh = False

            if asset_info["process"]["progress"] != progress:
                asset_info["process"]["progress"] = progress
                asset_logger.info(f"Processing {percent_complete}% - {state}")
                set_asset_info(task_id, asset_type, asset_info)
            time.sleep(2)

        asset_logger.info("Processing complete")
        asset_info["process"]["progress"] = 1
        asset_info["process"]["active"] = False
    except requests.exceptions.RequestException as e:
        asset_info["error"] = str(e)
        asset_logger.error(e)

    set_asset_info(task_id, asset_type, asset_info)
