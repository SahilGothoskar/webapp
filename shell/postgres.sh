#!/bin/bash

echo -e "Updating Packages"
sudo yum -y update

echo -e "Checking for PostgreSQL"
sudo amazon-linux-extras | grep postgre

echo -e "Adding PostgreSQL Repo"
sudo tee /etc/yum.repos.d/pgdg.repo<<EOF
[pgdg13]
name=PostgreSQL 13 for RHEL/CentOS 7 - x86_64
baseurl=http://download.postgresql.org/pub/repos/yum/13/redhat/rhel-7-x86_64
enabled=1
gpgcheck=0
EOF

echo -e "Updating Package Cache"
sudo yum makecache

echo -e "Installing PostgreSQL and Related Packages"
sudo yum install postgresql13 postgresql13-contrib postgresql13-server -y

echo -e "Initializing PostgreSQL Database Cluster"
sudo /usr/pgsql-13/bin/postgresql-13-setup initdb

echo -e "Stopping PostgreSQL Service"
sudo systemctl stop postgresql-13.service

echo -e "Starting PostgreSQL Service"
sudo systemctl start postgresql-13.service

echo -e "Enabling PostgreSQL Service at Boot"
sudo systemctl enable postgresql-13.service

echo -e "Checking PostgreSQL Service Status"
sudo systemctl status postgresql-13.service

echo -e "Creating a Test Database"
sudo -u postgres psql <<EOF
\x
ALTER ROLE postgres WITH PASSWORD 'redhat';
CREATE DATABASE "test";
\q
EOF

echo -e "Restarting PostgreSQL Service"
sudo systemctl stop postgresql-13.service
sudo systemctl start postgresql-13.service

echo -e "Checking PostgreSQL Service Status"
sudo systemctl status postgresql-13.service
