UniMon
==============
* Multi-clouds monitoring framework using Redis backend. Redis is used to store the monitored data that can be accessed in real-time.
* Monitoring tool for the [LEADS project](http://www.leads-project.eu/wiki/)

# Configuration #
* Add 1) the hostnames or the IP addresses of the hosts that you want to monitor and 2) IP of the redis server at beginning of fabfile (Line [23/24](https://github.com/leads-project/unimon/blob/master/fabfile.py#L23) in `fabfile.py`).

# How to run the code #
* Install [fabric](http://www.fabfile.org/)
   * `$ sudo apt-get install fabric` (under Ubuntu) 
* Install requirements:
   * `$ fab requirement`
* Upload the probe program (i.e., the client for monitoring a machine) to the hosts: 
   * `$ fab uploadMonitor`
* Start the master that receives the probes (CPU, RAM, and network utilization): 
   * `$ fab startMonitor`
* Start the web interface: 
   * `$ fab runWeb`
* Access: `http://IP_of_Redis_server:6868/` in order to get the real-time monitoring data from multiple clouds
* You can also use any redis compatible client in order to pull the collected data directly from the Redis database
* Stop the master via:
   * `$ fab stopMonitor`

# Contact #
* Do Quoc Le (SE Group TU Dresden): do@se.inf.tu-dresden.de 


