# Server Setup Instruction

## Instructions

### Step 1 - Pre-Required

#### 1. MongoDB Server

The following parameters are required after setting up the MongoDB:

* Server URL: Either activated with SSL or without SSL
* MongoDB Port: 27017 by default
* MongoDB Username
* MongoDB User Password: Avoid lots of special characters
* MongoDB User Authentication Database: Defined for each user once created.

Confirm the above parameters by running
( make sure to provide the SSL options in case you are connecting via TLS ):

```sh
mongo --host <mongo-url> --port <mongo-port> --username <mongo-username> --password <mongo-password> --authenticationDatabase <mongo-authSource>
```

If the connection was successful then generate the following URI and keep it in pocket.

```sh
MONGO_URI = "mongodb://<mongo-username>:<mongo-password>@<mongo-url>:<mongo-port>/simard?authSource=<mongo-authSource>"
```

and for **SSL**

```sh
MONGO_URI = "mongodb+srv://<mongo-username>:<mongo-password>@<mongo-url>/simard?authSource=<mongo-authSource>"
```

Handle Backup:

Make to sure to prepare the same parameters for the database you want to export
the data from and run the following command ( make sure mongodb-tools are installed )

```sh
mongodump --host <mongo-url> --port <mongo-port> --username <mongo-username> --password <mongo-password> --authenticationDatabase <mongo-authSource> --db simard
```

The process is going to take a while, but once finished you gonna end up with a
directory called dump which has another directory in it called simard.
Now we want to import these data to our own database.
Run the following command for that. ( make sure that there is no db in your
mongodb called simard, the backup will automatically create that.

```sh
mongorestore --host <mongo-url> --port <mongo-port> --username <mongo-username> --password <mongo-password> --authenticationDatabase <mongo-authSource> ./dump
```

And now we have everything related to mongoDB set and ready to use.

#### 2. Redis Instance

The following parameters are required after setting up the Redis instance:

* Server URL: Either with SSL or without SSL
* Redis port: the default is 6379
* Redis password
* Redis ACL username: ( only if ACL is enabled with redis v6 and higher )
* Redis ACL password: ( only if ACL is enabled with redis v6 and higher )

After you have all the parameters generate the following URL and keep it pocket.

```sh
redis<s?>://<acl-username>:<acl-password>@<redis-url>:<redis-port>/?password=<redis-password>
```

in case of no ACL:

```sh
redis<s?>://<redis-url>:<redis-port>/?password=<redis-password>
```

`<s>` = append 's' if ssl is enabled

**Note:** No backup is required for Redis instance.

### Step 2. Prepare environment

#### i. Clone the Repository

#### ii. Install Simard

##### 1. Install Python and PIP

Simard is tested on python3.9 and 3.8 with successful results. However due to
some dependency updates in python3.10 the Simard app is not compatible to run
based on that.
By default Ubuntu 20.04 comes with python3.8 and PIP 20.
In case of updates or re-installations please follow the steps in the [Quick Guides]

##### 2. Create Virtual Environment

You can use the `virtualenv` program to create a new python virtual environment.
By default Ubuntu 20.04 is missing this package, but to install please refer to
[Quick Guides] and pick the installation method you like.

To create a virtual environment run the following once your are in the rep directory

```sh
<virtualenv> env
```

Replace `<virtualenv>` with the command used to run `virtualenv`, please refer to
[Quick Guides]. Now that you have a virtual environment you can activate by running:

```sh
source env/bin/activate
```

##### 3. Install Dependencies

Simard repository includes a `requirements.txt` file, which a list of required
dependencies for Simard. With the virtual environment activated Run:

```sh
pip3 install -r requirements.txt
```

The process may take a few minutes to download and install all the required packages.

### Step 3. Configure environment

Now that we have the Simard app set we have to configure the integration and
secret values in order to run on different stages, simard configuration values
are stored in `.env` inside the root directory of the repository.
The repository comes with a `.env.sample` file which you can copy lots of values
from. To start run the following command

```sh
cp .env.sample .env
```

And now using a text-editor open .env file and update the following lines:

```sh
MONGO_URL = <set it to your own Mongo_url that you've prepared before in step 1>
...
REDIS_URL = <set it to your own REDIS-URL which you had in pocket from step 1>
```

However you will find some other values missing from the .env.sample file, at
this stage you may ask the team to share the .env file you are looking for either
( Staging env, Production env, QA env ), each env will have different configurations.

**Note** all the rest of setup is same for any environment, but the only part that
differs is the configuration values in `.env` file

**Note** Keep in mind that all of the environments you will replace the `<MONGO-URL>`

and `<REDIS-URL>` with the ones that you prepared in [Step.1]

After this step you should be able to run the app with no issue, try the following:

```sh
flask run
```

### Step 4. Setup Gunicorn

#### Installation

The perfect installation for the gunicorn is through virtual environment with
pip, you can install gunicorn with the following command: ( with the virtual
environment activated )

```sh
pip3 install gunicorn
```

**Note**: You can also install gunicorn through global apt repositories but it
is not recommended when having a virtual environment, that solution will work
best if the python packages are also installed globally.

Installing through apt package manager repositories:

```sh
sudo apt-get install gunicorn
```

#### Configuration

To run Simard app inside gunicorn we can have a gunicorn config file, but it is
not required at this stage.
To run Simard as gunicorn service we need to write a service file which will
look something like the following:

```sh
[Unit]
Description=gunicorn service to run the Simard flask app
After=network.target
[Service]
User=<user>
Group=<user>
WorkingDirectory=/home/<user>/simard
ExecStart=/home/<user>/simard/env/bin/gunicorn --bind 0.0.0.0:5000
--workers 2 --log-level=info --log-file=- simard:app
[Install]
WantedBy=multi-user.target
```

The upper code will create a service file, that runs simard inside gunicorn. It
should be located in `/etc/systemd/system/<service-name>.service`

#### Service Setup

After writing the service file, it is required to reload the daemon services in
Ubuntu, to detect the new changes in service script files. You can do that by
Running the following command:

```sh
sudo systemctl daemon-reload
```

**Note**: You can also use other service managers, such as `service`. But make
sure to check the docs for different commands.

After the service file is detected by the service manager ( `systemctl` ) you
can now run your service by:

```sh
sudo systemctl start <service-name>.service
```

In order enable the system on machine startup, Run:

```sh
sudo systemctl enable <service>.name
```

## Definition

## To Remind / Notes

## Quick Guides

### Up to date

When starting with a clean OS it's good to run the following commands always first:

```sh
sudo apt-get update && sudo apt-get upgrade
```

This will make sure to update all of the dependencies and packages in the OS.

### Install Python3.9

To install a specific version of python globally ( such as python3.9 ), Run:

```sh
sudo apt-get install python3.9
```

Confirm the installation by running

```sh
python3.9 --version
```

### Install pip3

On most of Ubuntu based distro(s) the pip3 is already installed in the system.
But in case you are missing pip3, Run the following command:

```sh
sudo apt-get install python3-pip
```

Confirm the installation by running:

```sh
pip3 --version
```

### Install virtualenv

On Ubuntu there is two ways to installed virtualenv

(1) Installing from pip packages as a python package
( **Recommended** )

```sh
pip3 install virtualenv
```

Confirm the installation by running

```sh
python3.9 -m virtualenv --version
```

**Note**: You can also add this to the PATH or create an alias for

(2) The first way is from apt package manager, which will install a global bin

```sh
sudo apt-get install python-virtualenv
```

Confirm the installation by running:

```sh
virtualenv --version
```
