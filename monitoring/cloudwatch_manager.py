import boto3
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()


session = boto3.Session()

cloudwatch = session.client("cloudwatch")



def get_ec2_metrics(instance_id):
    end = datetime.utcnow()
    start = end - timedelta(minutes=10)
    metrics = {}

    def fetch_metric(name, stat):
        resp = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName=name,
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start,
            EndTime=end,
            Period=300,
            Statistics=[stat]
        )
        return resp["Datapoints"][0][stat] if resp["Datapoints"] else 0

    metrics["CPUUtilization"] = fetch_metric('CPUUtilization', 'Average')
    metrics["NetworkIn"] = fetch_metric('NetworkIn', 'Sum')
    metrics["NetworkOut"] = fetch_metric('NetworkOut', 'Sum')
    metrics["DiskReadOps"] = fetch_metric('DiskReadOps', 'Sum')
    metrics["DiskWriteOps"] = fetch_metric('DiskWriteOps', 'Sum')

    return metrics


def get_s3_metrics(bucket_name):
    try:
        metrics = {}

        # Nombre total d’objets
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='NumberOfObjects',
            Dimensions=[
                {'Name': 'BucketName', 'Value': bucket_name},
                {'Name': 'StorageType', 'Value': 'AllStorageTypes'}
            ],
            StartTime=datetime.utcnow() - timedelta(hours=1),
            EndTime=datetime.utcnow(),
            Period=3600,
            Statistics=['Average']
        )

        if response["Datapoints"]:
            metrics["object_count"] = response["Datapoints"][0]["Average"]

        # Taille totale
        size_resp = cloudwatch.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='BucketSizeBytes',
            Dimensions=[
                {'Name': 'BucketName', 'Value': bucket_name},
                {'Name': 'StorageType', 'Value': 'StandardStorage'}
            ],
            StartTime=datetime.utcnow() - timedelta(hours=1),
            EndTime=datetime.utcnow(),
            Period=3600,
            Statistics=['Average']
        )

        if size_resp["Datapoints"]:
            metrics["bucket_size_bytes"] = size_resp["Datapoints"][0]["Average"]

        return metrics

    except Exception as e:
        return {"error": str(e)}