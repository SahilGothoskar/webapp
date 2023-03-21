#! /bin/bash
# sudo yum install amazon-cloudwatch-agent

 sleep 10
 
 wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm

 sudo rpm -U ./amazon-cloudwatch-agent.rpm

 sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -a start

 sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ec2-user/scripts/webApp/config.json -s