import boto3
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()


session = boto3.Session()

cloudwatch = session.client("cloudwatch")


def get_ec2_metrics(instance_id):
    end = datetime.utcnow()
    start = end - timedelta(minutes=5)

    metrics = {}

    # CPU Utilization
    cpu = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='CPUUtilization',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=['Average']
    )
    if cpu["Datapoints"]:
        metrics["cpu"] = cpu["Datapoints"][0]["Average"]

    # NetworkIn
    net_in = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='NetworkIn',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=['Sum']
    )
    if net_in["Datapoints"]:
        metrics["network_in"] = net_in["Datapoints"][0]["Sum"]

    # NetworkOut
    net_out = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='NetworkOut',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=['Sum']
    )
    if net_out["Datapoints"]:
        metrics["network_out"] = net_out["Datapoints"][0]["Sum"]

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
