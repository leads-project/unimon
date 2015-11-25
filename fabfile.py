#
# (C) Do Le Quoc, 2014
#

from fabric.api import *
import fabric.contrib.files
import time
import logging
import os
from fabric.contrib.files import append

#Disable annoyting log messages.
logging.basicConfig(level=logging.ERROR)

#This makes the paramiko logger less verbose
para_log=logging.getLogger('paramiko.transport')
para_log.setLevel(logging.ERROR)

env.keepalive = True


env.roledefs = {
    'servers': ['cawler0'],
    'workers': ['crawler0', 'crawler1', 'crawler2'],
}
redisserver = 'x.x.x.x'
env.user='ubuntu'
env.key_filename = '/home/ubuntu/.ssh/id_rsa'

#install dependences
@roles('servers', 'workers')
def requirement():
    run('echo "Y"|sudo pip install BeautifulSoup')
    run('echo "Y"|sudo apt-get install python-pip')
    run('echo "Y"|sudo apt-get install python-dev')
    run('echo "Y"|sudo pip install redis')
    run('echo "Y"|sudo pip install flask')
    run('echo "Y"|sudo apt-get install dtach')
    run('echo "Y"|sudo apt-get install git')
    run('echo "Y"|sudo apt-get install redis-server')
    run('echo "Y"|sudo pip install ujson')
    run('echo "Y"|sudo pip install psutil')

#Upload DoLen probe daemon
@roles('workers', 'servers')
def uploadMonitor():
    put("./probe.py", "/tmp/probe.py")

@roles('workers', 'servers')
def removeMonitor():
    full_path_to_file = "/tmp/probe*"
    
    if fabric.contrib.files.exists(full_path_to_file):
        run('rm ' + full_path_to_file)
    full_path_to_file = "~/probe*"
    with settings(warn_only=True):
        run('rm ' + full_path_to_file)


#Start DoLen probe daemon
@roles('servers', 'workers')
def startMonitor():
    if env.host_string in env.roledefs['workers'] or  env.host_string in env.roledefs['servers']:
        run('nohup python /tmp/probe.py --source vm  --cloud 0 --vms ' + env.host_string + ' --redisserver ' + redisserver + ' --redisport 3737' + ' >& /dev/null < /dev/null &',pty=False)


@roles('servers', 'workers')
def stopMonitor():
    with settings(warn_only=True):
        run("pkill -f 'probe.py'")

#Run DoLen frontend
@roles('servers')
def runWeb():
    cmd =  'dtach -n /tmp/dtach-DoLen-web-server python web/app.py'
    run(cmd, pty=True)    

@serial
def runMonitor(): 
    execute(uploadMonitor)
    execute(startMonitor)
    execute(runWeb)    
    
