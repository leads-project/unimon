#
# (C) Do Le Quoc, 2014
#

#!/usr/bin/python

from flask import Flask, render_template, g, redirect, url_for, request
from ujson import loads

from version import __version__

from cloud import VirtualMachine
import json

from monitordata import reportData
import time

from threading import Thread
from flask.ext.socketio import SocketIO, emit



app = Flask(__name__)
timewindow = 1 # monitoring data every second
thread = None
socketio = SocketIO(app)


def server_context():
    return {
        'Cloud_service_status': 'running',
        'Cloud_version': __version__
    }

@app.before_request
def before_request():
    g.config = app.config
    g.server = server_context()
    micro_clouds={}
    cloud_names=[]

    try:
        with open("clouds.cache") as cachefile:
           clouds_cache = json.load(cachefile)
           print clouds_cache
           print float(clouds_cache["timestamp"])
           if ((float(time.time()) - float(clouds_cache["timestamp"])) < 120.0):
               print clouds_cache
               clouds = clouds_cache
           else:
               clouds = getAllClouds("cloud.auth")
               clouds_cache = clouds
               with open('clouds.cache', 'w') as outfile:
                   clouds_cache["timestamp"] = time.time()
                   json.dump(clouds_cache, outfile)
    except:
        clouds = getAllClouds("cloud.auth")      
        clouds_cache = clouds
        with open('clouds.cache', 'w') as outfile:
            clouds_cache["timestamp"] = time.time()
            json.dump(clouds_cache, outfile)
    print clouds 
    del clouds["timestamp"]
    auth = open("cloud.auth")
    clouds_config = json.load(auth)
    g.clouds = clouds 
    initdata = []

    print clouds
    print "Getting clouds metadata"
    for cloud in clouds:
        monitorhost = clouds_config[cloud]["monitorhost"]
        monitorport = clouds_config[cloud]["monitorport"]
        status = {}
        status["status-cloud"] = 0 #MicroCloud is offline
        status["data_detail"] = []
        stats, active_vms_num, vm_total = reportData(cloud, clouds[cloud], timewindow, monitorhost, monitorport)
        status["data_detail"] = stats
        cloud_names.append(cloud)
        
        if active_vms_num > 0:
            status["status-cloud"] = 1 #MicroCloud is online
        status["name"] = cloud
        status["id"] = cloud
        initdata.append(status) 
        micro_clouds[cloud] = str(active_vms_num) + ", " + str(vm_total)
    g.nodes = micro_clouds
    g.cloud_types = cloud_names


def getRealtimeData(clouds_cache):
    print "Getting realtime data"
    micro_clouds={}
    cloud_names=[]
    cache = open(clouds_cache)
    clouds = json.load(cache)
    del clouds["timestamp"]
    auth = open("cloud.auth")
    clouds_config = json.load(auth)
    initdata = []

    for cloud in clouds:
        monitorhost = clouds_config[cloud]["monitorhost"]
        monitorport = clouds_config[cloud]["monitorport"]
        status = {}
        status["status-cloud"] = 0 #MicroCloud is offline
        status["data_detail"] = []
        stats, active_vms_num, vm_total = reportData(cloud, clouds[cloud], timewindow, monitorhost, monitorport)
        status["data_detail"] = stats
        cloud_names.append(cloud)

        if active_vms_num > 0:
            status["status-cloud"] = 1 #MicroCloud is online
        status["name"] = cloud
        status["id"] = cloud
        initdata.append(status)
        micro_clouds[cloud] = str(active_vms_num) + ", " + str(vm_total)
         
    return json.dumps(initdata)
       
   

def getVMsList(cloudID):
    vms_status ={}
    vm = VirtualMachine()
    servers = vm.listInstances(cloudID)

    if servers != -1:
        for server in servers:
            if server.status == "ACTIVE":
                vms_status[server.name] = "Running..."
            else:
                vms_status[server.name] = "Stopped"

    return vms_status

def getAllClouds(configfile):
    auth = open(configfile)
    clouds = json.load(auth)
    all_clouds = {}

    for cloud in clouds:
        vms = getVMsList(cloud)
        if vms is not None:
            all_clouds[cloud] = vms
        else:
            all_clouds[cloud] = "Unavailable"

    return all_clouds


def background_thread():
    count = 0

    while True:
        count+=1;

        if count==1:
            time.sleep(5)
        else:
            time.sleep(2)
        initdata = getRealtimeData("clouds.cache")
        socketio.emit('init_data',
                      {'data': initdata},
                      namespace='/systemstatus')


@socketio.on('connect', namespace='/systemstatus')
def test_connect():
    initdata = getRealtimeData("clouds.cache")
    emit('init_data', {'data': initdata})


@socketio.on('disconnect', namespace='/systemstatus')
def test_disconnect():
    print('Client disconnected')

@app.route("/")
def index():
    
    return render_template('index.html')

@app.route("/clouds")
def nodes():
    return render_template('clouds-statistic.html')

@app.route("/nodes-status")
def cloud_types():
    global thread
    if thread is None:
        thread = Thread(target=background_thread)
        thread.start()

    return render_template('nodes-status.html')




@app.route('/setting', methods=['POST', 'GET'])
def setting():
    config = {}
    scalingstyle = ['0','1']

    if request.method == 'POST':
        config['cputhreshold'] = request.form['cputhreshold']
        config['scalingstyle'] = request.form['scalingstyle']

        if config['cputhreshold'].isdigit():
            if config['scalingstyle'] in scalingstyle:
                with open('setting.json', 'w') as outfile:
                    json.dump(config, outfile)
           
                return render_template('success.html')
            else:
                 
                return render_template('unsuccess-scaling.html')
        else:
          
            return render_template('unsuccess.html')
    else:
        return render_template('setting.html')


if __name__ == '__main__':
    socketio.run(app, host = "0.0.0.0", port=6868)

