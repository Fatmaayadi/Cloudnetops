import boto3
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Session et clients avec région définie
session = boto3.Session(region_name=AWS_REGION)
ec2 = session.resource("ec2")
s3 = session.client("s3", region_name=AWS_REGION)

# ------------------------------
# EC2 FUNCTIONS
# ------------------------------


def create_ec2_instance():
    try:
        instance = ec2.create_instances(
            ImageId="ami-0156001f0548e90b1",
            InstanceType="t2.micro",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [{'Key': 'CreatedBy', 'Value': 'CloudNetOps'}]
            }]
        )[0]

        instance.wait_until_running()
        instance.reload()

        # Activer le monitoring détaillé
        ec2_client = boto3.client('ec2', region_name=AWS_REGION)
        ec2_client.monitor_instances(InstanceIds=[instance.instance_id])

        return instance.instance_id
    except Exception as e:
        return {"error": str(e)}



def terminate_ec2_instance(instance_id):
    try:
        instance = ec2.Instance(instance_id)
        return instance.terminate()
    except ClientError as e:
        return {"error": str(e)}

# ------------------------------
# S3 FUNCTIONS
# ------------------------------

def create_s3_bucket(bucket_name):
    try:
        # Pour us-east-1, LocationConstraint ne doit pas être fourni
        if AWS_REGION == "us-east-1":
            return s3.create_bucket(Bucket=bucket_name)
        else:
            return s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": AWS_REGION}
            )
    except ClientError as e:
        return {"error": str(e)}

def delete_s3_bucket(bucket_name, force=False):
    try:
        if force:
            bucket = session.resource("s3").Bucket(bucket_name)
            bucket.objects.all().delete()

        return s3.delete_bucket(Bucket=bucket_name)

    except ClientError as e:
        return {"error": str(e)}
