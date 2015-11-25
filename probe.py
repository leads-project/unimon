#
# (C) Do Le Quoc, 2014
#


import redis
import os
import sys
import time
import threading
import signal
import socket
import logging
import argparse
import subprocess
from BeautifulSoup import BeautifulSoup as bs
from xml.etree import ElementTree
import urllib2
import psutil

TERMINATE  = False
REPORT_PERIOD = 1.0 ##sec


#Redis communication
def setVariable(timestamp, cloud, vm, source, values):
    key = ":".join([str(cloud), str(vm), str(source)])
    score = timestamp
    value = addToStr(addToStr('timestamp', timestamp, ':'), values)
    rServer.zadd(key, value, score)

def getKeys():
    keypattern = "*"
    response = rServer.keys(keypattern)
    return response


#text processing functions
def addToStr(stats, value, delim = ','):
    if stats == '':
        stats = value
    else:
        stats = delim.join([str(stats), str(value)]) 
    return stats

def print_xml(ctx, path):
    res = ctx.xpathEval(path)
    if res is None or len(res) == 0:
        value = None
    else:
        value = res[0].content
    return value

def getvms():
    vms = []
    keys = getKeys()
    for line in keys:
        elements = line.split(":")
        vms.append(elements[1])
    return vms


#DoLen probe daemon
class MonitoringMetrics:

    def __init__(self, logger):
        self.metrics = ['MemTotal', 'MemFree', 'Buffers', 'Cached', 'SwapTotal', 'SwapFree', 'CPU', 'Bytes_sent', 'Bytes_received', 'Packets_sent', 'Packets_received']
        self.logger = logger

    def probe(self, elapsed_sec, vmip) :
        try:
            stats = ''

            #Memory
            fin = open('/proc/meminfo', 'r')
            for line in fin:
                elements = line.split()   
                metric = elements[0].split(':')[0]
                if metric in self.metrics:
                    stats = addToStr(stats, addToStr(metric, elements[1], ':'))
            fin.close()

            #CPU
            cpu = psutil.cpu_percent()
            cpu_num = psutil.cpu_count() 
            stats = addToStr(stats, addToStr('CPU', cpu, ':'))
            stats = addToStr(stats, addToStr('CPUTotal', cpu_num, ':'))

            #Network
            net_per_nic = psutil.net_io_counters(pernic=True)#["eth0"]            
            #print net_per_nic
            net_info = {}
            for key, value in net_per_nic.iteritems():
                net_info[key] = {'Bytes_sent': value.bytes_sent,
                'Bytes_received': value.bytes_recv,
                'Packets_sent': value.packets_sent,
                'Packets_received': value.packets_recv,}
            eth0_info = net_info["eth0"] #VMs in AWS and Cloud&Heat contain only eth0 NIC
            for metric in eth0_info:
                if metric in self.metrics:
                    stats = addToStr(stats, addToStr(metric, eth0_info[metric], ':'))

        except Exception, e:
            self.logger.error("Error in MonitoringMetrics probe method : " + str(e))

        #print stats
        return stats


#Logging
def createLogger(source , vmname):
    loggername = 'DoLen_'+ str(source) + '_' + str(vmname)
    logger = logging.getLogger(loggername)
    hdlr = logging.FileHandler(loggername + '_.log')
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    hdlr.setFormatter(formatter)
    logger.addHandler(hdlr)
    logger.setLevel(logging.INFO)
    return logger



#Report 
def record(probes, cloud, vms, source) :
    prev = 0
    prevms = vms
    while not TERMINATE :
        #print vms
        if source == 'app' and (len(vms) == 0 or len(vms)!=len(prevms)):
            prevms = vms
            vms = getvms()
            #prev = dict((key, 0) for key  in vms)
        for vm in vms:
            stats = ''
            now = time.time()
            elapsed_sec = 0 if prev == 0 else (now - prev)
            for p in probes :   
                stats = addToStr(stats, p.probe(elapsed_sec, vm))
            if source == 'app':
                break
            setVariable(now, cloud, vm, source, stats)
            prev = now
        if source == 'app':
            for vm in vms:
                setVariable(now, cloud, vm, source, stats)        
        time.sleep(REPORT_PERIOD)


#Terminate handler
def sigterm_handler(signum, frame) :
    print 'Terminate was called'
    print 'Signal handler called with signal', signum
    print "At ", frame.f_code.co_name, " in ", frame.f_code.co_filename, " line " , frame.f_lineno
    global TERMINATE
    TERMINATE = True


if __name__ == '__main__':
    signal.signal(signal.SIGINT, sigterm_handler)
    signal.signal(signal.SIGTERM, sigterm_handler)
    parser = argparse.ArgumentParser(description='Enter VM location data')
    parser.add_argument('--source', metavar='D', type=str, choices=['vm', 'host', 'app'],
                       help='data source(vm or host)')
    parser.add_argument('--cloud', metavar='C', type=str, default='None',
                       help='cloud identificator')
    parser.add_argument('--vms', metavar='I', type=str, nargs='+', default='None', 
                       help='VMs IP addresses')
    parser.add_argument('--redisserver', metavar='R', type=str, default='localhost', 
                       help='redis server ip')
    parser.add_argument('--redisport', metavar='P', type=int, default=6379,
                       help='redis server port')
    parser.add_argument('--actuator', action='store_true', default=False,
                       help='Work as host capacity manager')

    args = parser.parse_args()
    logger = createLogger(args.source, args.vms)
    try:
        infoStr = 'cloud:' + str(args.cloud) + ' vms:' + str(args.vms) + ' dataSource:' + str(args.source) + ' redisServer:' + str(args.redisserver) + ' redisPort:' + str(args.redisport) + ' actuator:' + str(args.actuator)  
        logger.info(infoStr)
        rServer = redis.Redis(host=args.redisserver, port=args.redisport, db=0)
        vmsList = list(args.vms)
        if args.source == 'vm':
            record([MonitoringMetrics(logger)], args.cloud, vmsList, args.source)
    except Exception, e:
        logger.error("Error in Main method : " + str(e))
