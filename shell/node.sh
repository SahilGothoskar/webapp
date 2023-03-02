#!/bin/bash


echo -e "Script Started to Install Node"
sleep 10

echo -e "Package Update"
sudo yum update -y


echo -e "Installation of NodeJs"
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -
sudo yum install -y nodejs



#sudo yum install unzip
echo -e "Unzipping WebApp Application"
sudo mkdir /home/ec2-user/scripts/webApp
unzip /home/ec2-user/scripts/webApp.zip -d /home/ec2-user/scripts/webApp
sudo chmod 755 /home/ec2-user/scripts/webApp
cd /home/ec2-user/scripts/webApp/seeders

echo -e "Installing Dependencies"
sudo npm i
sudo npm i bcrypt


sleep 10

echo -e "Configuring SystemD"
sudo mv /tmp/node.service /etc/systemd/system/

echo -e "Starting Service"
sudo systemctl daemon-reload
sudo systemctl start node.service
sudo systemctl enable node.service


#echo -e "Restarting Service"
#sudo systemctl stop node.service
#sudo systemctl daemon-reload
#sudo systemctl start node.service
#sudo systemctl restart node.service
