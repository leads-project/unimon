# UniMon
Multi-clouds monitoring framework. The old name is DoLen.

###What is this repository for? ###
* Multi-clouds monitoring framework using Redis backend. Redis is used to store monitoring data that can be accessed in real-time.
* Monitoring tool for LEADS project.
* [Wiki](http://www.leads-project.eu/wiki/)

### How to run? ###
* Install requirements: $fab requirement
* Add the hostname or IP address of VMs that you want to monitor and IP of Redis server at beginning of fabfile
* Upload probe program to VMs: $fab uploadMonitor
* Start monitor VMs (CPU, RAM, and network utilization): $fab startMonitor
* Start Web interface: $fab runWeb
* Access: http://IP_of_Redis_server:6868/ to get real-time monitoring data from multiple clouds
* You also can create a client to get data directly from Redis
* Stop monitor VMs on multiple clouds: $fab stopMonitor

### Contact? ###
* Do Le Quoc (SE Group TU Dresden): do@se.inf.tu-dresden.de 


