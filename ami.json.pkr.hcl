packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_access_key" {
  type    = string
  
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_secret_key" {
  type    = string
  
}

# The amazon-ami data block is generated from your amazon builder source_ami_filter; a data
# from this block can be referenced in source and locals blocks.
# Read the documentation for data blocks here:
# https://www.packer.io/docs/templates/hcl_templates/blocks/data
# Read the documentation for the Amazon AMI Data Source here:
# https://www.packer.io/plugins/datasources/amazon/ami
data "amazon-ami" "awsdev_ami" {
  // id = "${var.source_ami}"
  access_key = var.aws_access_key
  filters = {
    name                = "amzn2-ami-hvm-*"
    root-device-type    = "ebs"
    virtualization-type = "hvm"
  }
  most_recent = true
  owners      = ["amazon"]
  region      = var.aws_region
  secret_key  = var.aws_secret_key
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}


source "amazon-ebs" "Custom_AMI" {
  access_key    = var.aws_access_key
  ami_name      = "Aws_AMI-${local.timestamp}"
  ami_users     = ["241886877002"]
  instance_type = "t2.micro"
  region        = "${var.aws_region}"
  secret_key    = var.aws_secret_key
  source_ami    = "${data.amazon-ami.awsdev_ami.id}"
  ssh_username  = "ec2-user"
  tags = {
    Name = "Custom AMI"
  }
}

# a build block invokes sources and runs provisioning steps on them. The
# documentation for build blocks can be found here:
# https://www.packer.io/docs/templates/hcl_templates/blocks/build
build {
  sources = ["source.amazon-ebs.Custom_AMI"]

  provisioner "shell" {
    inline = ["sudo mkdir -p /home/ec2-user/scripts", "sudo chown -R ec2-user:ec2-user /home/ec2-user/scripts", "sudo chmod -R 755 /home/ec2-user/scripts"]
  }

  provisioner "file" {
    destination = "/tmp/node.service"
    source      = "service/node.service"
  }

  provisioner "file" {
    destination = "/home/ec2-user/webApp.zip"
    source      = "./webApp.zip"
  }

  // provisioner "file" {
  //   destination = "/home/ec2-user/scripts/postgres.sh"
  //   source      = "shell/postgres.sh"
  // }

  provisioner "file" {
    destination = "/home/ec2-user/scripts/node.sh"
    source      = "shell/node.sh"
  }

  provisioner "shell" {
    inline = [  "sudo chmod o+x /home/ec2-user/scripts/node.sh", "sudo /home/ec2-user/scripts/node.sh"]
  }

  provisioner "shell" {
    inline = ["rpm -Va --nofiles --nodigest"]
  }

}
