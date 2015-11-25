//define('sysicons', [ 'common', 'underscore', 'backbone', 'd3' ], 
//$(document).ready(function(){
//  var socket = io.connect('http://' + document.domain + ':' + location.port + '/systemstatus');
//     socket.on('init_data', function(msg) {
 //     init_data=msg.data;  
$(function() {
      //var zones-update;
      var init = function(containerId, initialData) {

	//console.log('initialData');
        //console.log(initialData);
        var Zone = Backbone.Model.extend({
            allowedToEdit : function(account) {
                return false;
            },
            defaults : {
                id : 0,
                name : '',
                status : 'offline',
                data_detail : []
            },
            getStatus : function() {
                return this.get('status-cloud') ? 'online' : 'offline';
            },
            getNumChildren : function() {
                return this.get('data_detail').length;
            },
        });

        var Zones = Backbone.Collection.extend({
            model : Zone,
            //url : urls('dashboardClusterState'),
        });

        // create zone collection based on initial value
        var zones = new Zones(initialData);

        var w = $(containerId).width();
        var h = 400;
        var cornerRadius = 4;

        var maxChildren = _.max(zones.map(function(zone) {
            return zone.getNumChildren();
        }));

        var vScale = d3.scale.ordinal().domain(_.range(zones.length))
                .rangeBands([ 0, h ], 0.1, 0.1);

        // scale for horizontal layouting.
        // switch-icon
        var legendWidth = 45;
        var hScale = d3.scale.ordinal().domain(_.range(maxChildren))
                .rangeBands([ 23, w - legendWidth ], 0.15, 0.3);

        var svg = d3.select(containerId).append('svg').attr({
            width : '100%',
            height : h + 'px',
            viewBox : '0 0 ' + w + ' ' + h,
            'class' : 'sysiconscontainer',
        });

        var defs = svg.append('defs');


        var selectZoneGroup = function() {
            return svg.selectAll("g.__zone__").data(zones.models, function(d) {
                return d.get('name');
            });
        };

        var zonegroupenter = selectZoneGroup().enter();

        var zonegroup = zonegroupenter.append('g').attr({
            id : function(d) {
                return d.get('name')
            },
            transform : function(d, i) {
                return 'translate(15, ' + vScale(i) + ')';
            },
            'class' : '__zone__'
        });

        var w_node = hScale.rangeBand();
        var h_node = vScale.rangeBand() - 14;

        var w_switch = 40;
        var h_switch = h_node;

        var getSwitchClasses = function(sw) {
            return 'switch status-' + sw.getStatus();
        }

        /**
         * Switch icon
         */
        zonegroup.append('rect').attr({
            width : w_switch,
            height : h_switch,
            rx : cornerRadius,
            ry : cornerRadius,
            'class' : getSwitchClasses,
        });


        zonegroup.append('text').attr({
            x : w_switch / 2 + 15,
            y : h_switch + 20, //20x space from block of microcloud added by Do Le Quoc
            'text-anchor' : 'middle',
            'class' : 'biglabel',
        }).text(function(d) {
            if (d.get('name').indexOf('switch-') == 0) {
                //return 'MicroCloud ' + d.get('name').slice(-1);
                return '' + d.get('name').slice(-1);
            } else {
                //return 'MicroCloud ' + d.get('name');
                return '' + d.get('name');
            }
        });

        var selectNodeGroup = function(zoneGroup) {
            return zoneGroup.selectAll('g.__node__').data(function(d, i) {
                return d.get('data_detail');
            }, function(d) {
                return d.name;
            });
        }

        var nodeGroupEnter = selectNodeGroup(zonegroup).enter();

        var nodeGroup = nodeGroupEnter.append('g').attr({
            id : function(d) {
                return d.name;
            },
            transform : function(d, i) {
                return 'translate(' + hScale(i) + ', 0)';
            },
            'class' : '__node__',
        });

        var valueScale = d3.scale.ordinal().domain([ 'cpu', 'mem', 'nw_in', 'nw_out' ])
                .rangeBands([ 0, h_node ], 0.2, 0.25);

        /**
         * value legend
         */

        var hLegendScale = d3.scale.ordinal().domain([ 0 ]).rangeBands(
                [ 0, legendWidth ], 0, 0.25);

        var vLegendScale = d3.scale.ordinal().domain([ 'cpu', 'mem', 'nw_in', 'nw_out' ])
                .rangeBands([ 0, h / 3 ], 0.2, 0.5);

        var legendGroup = svg.append('g').attr({
            transform : 'translate(' + (w - legendWidth) + ',0)',
        });
        var addLegendItem = function(name) {
            legendGroup.append('rect').attr({
                'class' : 'bar-' + name,
                x : hLegendScale(0),
                y : vLegendScale(name),
                width : hLegendScale.rangeBand(),
                height : vLegendScale.rangeBand() / 2
            });
            legendGroup.append('text').attr({
                'class' : 'label',
                x : hLegendScale(0) + hLegendScale.rangeBand() / 2,
                'text-anchor' : 'middle',
                y : vLegendScale(name) + vLegendScale.rangeBand()
            }).text(name);
        };
        addLegendItem('cpu');
        addLegendItem('mem');
        addLegendItem('nw_in');
        addLegendItem('nw_out');

        /***********************************************************************
         * Status Indicator
         **********************************************************************/

        /**
         * Helper Function that returns the node-clip-path-ID for a node.
         */
        var nodeClipId = function(node) {
            return 'node-clip-' + node.name;
        }

        // width of the status indicator thingy
        var w_statusIndicator = 0.25 * w_node;

        // max width of the value indicator
        var w_valIndicator = w_node - w_statusIndicator;

        var getStatusIndicatorClass = function(item) {
            return 'statusIndicator ' + 'status-' + item.status;
        };

        // Status indicator rect
        nodeGroup.append('rect').attr({
            x : hScale.rangeBand() - w_statusIndicator,
            width : w_statusIndicator,
            height : vScale.rangeBand(),
            'class' : getStatusIndicatorClass,
            // 'shape-rendering' : 'optimizeSpeed',
            'clip-path' : function(d) {
                return 'url(#' + nodeClipId(d) + ')';
            },
        });

        var getNodeStatus = function(node) {
            if (node.status == 'shutdown') {
                return "shtdwn";
            } else if (node.status == 'online') {
                return 'on';
            } else if (node.status == 'offline') {
                return 'off';
            } else if (node.status == 'failure') {
                return 'restart';
            } else {
                return node.status;
            }
        };

        var getValueBarCss = function(attribute) {
            return "bar-" + attribute;
        }

        // Adds a value bar to the node group.
        var addValueBar = function(nodeGroup, attribute) {
            nodeGroup.append('rect').attr({
                x : 0,
                y : valueScale(attribute),
                height : valueScale.rangeBand(),
                width : function(d) {
                    return _.min([ 1, d[attribute] ]) * w_valIndicator;
                },
                'class' : getValueBarCss(attribute),
                'clip-path' : function(d) {
                    return 'url(#' + nodeClipId(d) + ')';
                },
            });
        };

        // add a bar for CPU
        addValueBar(nodeGroup, 'cpu');
 
        // add a memory bar
        addValueBar(nodeGroup, 'mem');

        // add a bar for network in
        addValueBar(nodeGroup, 'nw_in');

        // add a bar for network out
        addValueBar(nodeGroup, 'nw_out');


        // text for status indicator
        var xText = hScale.rangeBand() - (w_statusIndicator / 2) + 5;
        var yText = h_node / 2;
        nodeGroup.append('text').attr({
            x : xText,
            y : yText,
            'text-anchor' : 'middle',
            'class' : 'label __status-label__',
            transform : 'rotate(-90,' + xText + ',' + yText + ')',
        }).text(getNodeStatus);

        /**
         * node frame
         */
        nodeGroup.append('rect').attr({
            x : 0,
            width : w_node,
            height : h_node,
            'class' : 'node',
            rx : cornerRadius,
            ry : cornerRadius,
            'clip-path' : function(d) {

                // Create Clipping frame for the node so we have
                // rounded corners on the inside.
                defs.append('clipPath').attr({
                    id : nodeClipId(d),
                }).append('rect').attr({
                    x : 0,
                    width : w_node,
                    height : h_node,
                    rx : cornerRadius,
                    ry : cornerRadius,
                });
                return 'url(#' + nodeClipId(d) + ')';
            },
        });

        // label Node Name
        nodeGroup.append('text').attr({
            x : (w_node / 2),
            y : h_node + 20, //20 px space from node block added by Do Le Quoc
            'text-anchor' : 'middle',
            'class' : 'label',
        }).text(function(d) {
            return d.name;
        });

        /***********************************************************************
         * Tooltip for details
         **********************************************************************/
        var tooltip = (function() {
            var isInTooltip = false;
            var parent = d3.select('body').append('div').attr({
                id : '#sysiconsTooltip',
                'class' : 'hidden sysicons-tooltip',
            }).on('mouseover', function() {
                //console.log('mouseover');
                isInTooltip = true;
            }).on('mouseout', function() {
                //console.log('mouseout-tooltip');
                isInTooltip = false;
            });

            var title = parent.append('p').append('strong');
            var details = parent.append('table');
            details.attr('class', 'table table-condensed');
            details = details.append('tbody');
            var createRow = function(title) {
                var row = details.append('tr');
                row.append('td').text(title);
                return row.append('td');
            };
            var vcpus = createRow('#VCPUs');
            var memtotals = createRow('Memory');
            //var energy = createRow('Power');
            var microClouds = createRow('MicroCloud');
            var shutdown = createRow('Shutdown in');

            // Tooltip Interface
            var _self = {
                /**
                 * hides tooltip
                 */
                hide : function() {
                    parent.classed("hidden", true);
                    return _self;
                },
                /**
                 * shows tooltip
                 */
                show : function() {
                    parent.classed("hidden", false);
                    return _self;
                },

                /**
                 * set title text
                 */
                title : function(text) {
                    title.text(text);
                    return _self;
                },
                /**
                 * set vcpu value
                 */
                vcpus : function(text) {
                    vcpus.text(text);
                    return _self;
                },
                /**
                 * set memtotals-value
                 */
                memtotals : function(value) {
                    memtotals.text(value);
                    return _self;
                },
                /**
                 * set energy value
                 */
                /*energy : function(value) {
                    energy.text(value + ' W');
                    return _self;
                },*/
                /**
                 * set absolute position (x, y)
                 */
                position : function(x, y) {
                    parent.style({
                        left : x + 'px',
                        top : y + 'px',
                        transform : 'translate(-50%, -101%)',
                        '-webkit-transform' : 'translate(-50%, -101%)',
                    });
                    return _self;
                },

                /**
                 * set popularity class
                 */
                microClouds : function(value) {
                    microClouds.text(value);
                    return _self;
                },
                /**
                 * set value for shutdown timer (like "shutting down in ...")
                 */
                shutdown : function(value) {
                    if (value == -1) {
                        shutdown.text('n/a');
                    } else {
                        shutdown.text(value + ' s');
                    }
                    return _self;
                },
                mouseInTooltip : function() {
                    return isInTooltip;
                },

            };
            return _self;
        })();

        var updateTooltipHandler = function(element) {
            element.on("mouseover", function(d) {
                tooltip.title('Details ' + d.name);
                tooltip.position(d3.event.pageX, d3.event.pageY)
                tooltip.vcpus(d.vcpu);
                tooltip.memtotals(d.memtotal);
                //tooltip.energy((d.power * 0.005).toFixed(2));
                tooltip.microClouds(d.microCloud);
                tooltip.shutdown(d.shutdown);
                tooltip.show();
            }).on("mouseout", function(d) {
                if (!tooltip.mouseInTooltip()) {
                    tooltip.hide();
                }
            });
        };

        var tooltipRect = nodeGroup.append('rect').attr({
            fill : 'none',
            'class' : '__tooltip__',
            'pointer-events' : 'all',
            width : hScale.rangeBand(),
            height : vScale.rangeBand(),
        });

        updateTooltipHandler(tooltipRect);

        /***********************************************************************
         * Updates!
         */
        zones.bind('change', function() {
            var zoneGroup = selectZoneGroup();
            var nodeGroup = selectNodeGroup(zoneGroup);

            var updateValueBar = function(node, attr) {
                d3.select(node).select('rect.' + getValueBarCss(attr))
                        .transition().attr({
                            width : function(d) {
                                return w_valIndicator * _.min([ 1, d[attr] ]);
                            }
                        });
            };

            nodeGroup
                    .each(function(d, i) {
                        updateValueBar(this, 'cpu');
                        updateValueBar(this, 'mem');
                        updateValueBar(this, 'nw_in');
                        updateValueBar(this, 'nw_out');

                        d3.select(this).select('text.__status-label__').text(
                                getNodeStatus);

                        d3.select(this).select('rect.statusIndicator').attr({
                            'class' : getStatusIndicatorClass
                        });

                        updateTooltipHandler(d3.select(this).select(
                                'rect.__tooltip__'));
                    });

            // update zone status
            zoneGroup.each(function(d, i) {
                d3.select(this).select('rect.switch').attr({
                    'class' : getSwitchClasses,
                });
                //d3.select(this).select('.label').text(getZoneCurrentText(d));
            });
        });
    return zones;
    };
   
    var zonesupdate;
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/systemstatus');
    socket.on('init_data', function(msg) {
    // init_data=msg.data;
    if (!zonesupdate) {
        zonesupdate = init('#sysicons', JSON.parse(msg.data));
        $('#log').append('<p>Received: ' + msg.data   + '</p>');
    } else{
	 //console.log(JSON.parse(msg.data));
         zonesupdate.set(JSON.parse(msg.data));
         $('#log').append('<p>Received: ' + msg.data   + '</p>');
    }
    });

});


