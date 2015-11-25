#
# (C) Do Le Quoc, 2014
#


import redis
import time
import json

def metricHistory(POOL, cloud, vm, daemon, startTime, endTime):
    key = ":".join([str(cloud), str(vm), str(daemon)])
    rServer = redis.Redis(connection_pool=POOL)
    response = rServer.zrangebyscore(key, startTime, endTime)
    return response



def metricRealtimeParsed(POOL, cloud, vm, sources, startTime, endTime):
    history = {}
    for source in sources:
        result = metricHistory(POOL, cloud, vm, source, startTime, endTime)
        for line in result:
            data  = {}
            elements = line.split(',')
            for elem in elements:
                parameterData = elem.split(':')
                parameterName = parameterData[0]
                #print parameterName
                parameterValue = parameterData[1]
                if 'timestamp' == parameterName:
                    timestamp = int(float(parameterValue))##round time to seconds
                    data[parameterName] = timestamp
                else:
                    data[parameterName] = parameterValue
            if timestamp in history:
                oldData = history[timestamp]
                oldData.update(data)
                history = oldData
            else:
                history = data
    return history




def reportData(cloud, vms, timewindow, host, port):
    active_vms_num = 0
    vm_total = 0
    stats = []
    POOL = redis.ConnectionPool(host=host, port=int(port), db=0) # Connect to Redis Cluster
    now = time.time()
    sources = {'vm':None, 'host':None}
    net = {}
    try:
        netcache = open("network.cache")
        net = json.load(netcache)
    except:
        net[cloud] = {}
        for vm in vms:
            net[cloud][vm] = [0.0, 0.0]

    for vm in vms:
        vm_total = vm_total + 1
        status_vm = {}
        status_vm["memtotal"] = 4000
        status_vm["shutdown"] = -1.0
        status_vm["vcpu"] = 4
        status_vm["microCloud"] = cloud
        status_vm["name"] = vm
        status_vm["status"] = "offline"
        status_vm["mem"] = 0.0
        status_vm["cpu"] = 0.0
        status_vm["nw_in"] = 0.0
        status_vm["nw_out"] = 0.0
        cloud_id = cloud.split("MicroCloud")[-1] #Get Micro cloud ID
        if vms[vm] == "Running...":
            active_vms_num = active_vms_num + 1
            status_vm["status"] = "online"
            history = metricRealtimeParsed(POOL, cloud_id, vm, sources, now - timewindow -3, now - 3)
            print "history::::", history
            
            if history:
                ram = int(history["MemTotal"]) - int(history["MemFree"])
                nw_out = float(history["Bytes_sent"])
                nw_in = float(history["Bytes_received"])
                ram_total = int(history["MemTotal"]) #present in MB
                ram = float(ram/ram_total)
                status_vm["mem"] = ram
                status_vm["cpu"] = float(history["CPU"])/100
                status_vm["nw_in"] = (nw_in - net[cloud][vm][0])/134217728 # 1Gbps: 1024*1024*1024 (bytes)/8
                status_vm["nw_out"] = (nw_out - net[cloud][vm][1])/134217728
                net[cloud][vm][0] = nw_in
                net[cloud][vm][1] = nw_out
                #Dump to file for caching
                with open('network.cache', 'w') as outfile:
                    json.dump(net, outfile) 

                status_vm["vcpu"] = int(history["CPUTotal"])
                status_vm["memtotal"] = int(history["MemTotal"])

        stats.append(status_vm)
                    

    return stats, active_vms_num, vm_total

     
