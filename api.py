import logging
import requests
from enum import Enum

from app.plugins.views import TaskView
from app.plugins.worker import task
from app.plugins import logger

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .globals import PROJECT_NAME

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

def request():

###                        ###
#      MODEL CONFIG          #
###                        ###
class ModelType(str, Enum):
    ORTHOPHOTO = "ORTHOPHOTO"
    TERRAIN_MODEL = "TERRAIN_MODEL"
    SURFACE_MODEL = "SURFACE_MODEL"
    POINTCLOUD = "POINTCLOUD"
    TEXTURED_MODEL = "TEXTURED_MODEL"


FILE_TO_MODEL = {
    ModelType.ORTHOPHOTO: "orthophoto.tif",
    ModelType.TERRAIN_MODEL: "dtm.tif",
    ModelType.SURFACE_MODEL: "dsm.tif",
    ModelType.POINTCLOUD: "georeferenced_model.laz",
    ModelType.TEXTURED_MODEL: "textured_model.zip",
}
MODEL_TO_FILE = dict([reversed(i) for i in FILE_TO_MODEL.items()])

###                        ###
#         API VIEWS          #
###                        ###
class ShareTaskView(TaskView):
    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        available_assets = []
        output = {"available": available_assets, "exported": []}
        for file_name in task.available_assets:
            if file_name not in MODEL_TO_FILE:
                continue
            available_assets.append(MODEL_TO_FILE[file_name])

        return Response(output, status=status.HTTP_200_OK)


class AvailableTerrain(APIView):
    def get(self, request, format=None):



###                        ###
#       CELERY TASK(S)       #
###                        ###
@task
def upload_to_ion(task_id, name, description, model_type, options):
    task_info = get_task_info(task_id)
    task_logger = LoggerAdapter(prefix="Task %s" % task_id, logger=logger)

    try:
        import boto3
    except ImportError:
        import subprocess

        subprocess.call([sys.executable, "-m", "pip", "install", "boto3"])
        import boto3

    try:
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "name": name,
            "description": description,
            "attribution": attribution,
            "type": model_type,
            "options": options,
        }

        # Create Asset Request
        task_logger.info("Creating asset of type %s", model_type.value)
        res = requests.post(f"{api_address}/v1/assets", json=data, headers=headers)
        res.raise_for_status()

        access_key, secret_key, token, endpoint, bucket, prefix = pluck(
            res.json(),
            "accessKey",
            "secretAccessKey",
            "sessionToken",
            "endpoint",
            "bucket",
            "prefix",
        )

        # Upload
        task_logger.info("Upload complete")
        key = path.join(prefix, "unknown.glb")
        boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=token,
        ).upload_file(file_path, Bucket=bucket, Key=key)

        # On Complete Handler
        method, url, fields = pluck(
            self.session["onComplete"], "method", "url", "fields"
        )
        task_logger.info("Upload complete", task_id)
        res = requests.request(method, url=url, headers=headers, data=fields)
        res.raise_for_status()
    except requests.exceptions.RequestException as e:
        task_info["error"] = str(e)
        task_logger.error(e)

    set_task_info(task_id, task_info)
