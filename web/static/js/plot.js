var CPUSmoothies = [];
var RamSmoothies = [];

var CPUQuotaSmoothies = [];
var RamQuotaSmoothies = [];

//var sys = require('sys');

function init() 
{
   
    CPUSmoothies["cpuMicroCloud0"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100, minValue: 0 });
    CPUSmoothies["cpuMicroCloud0"].streamTo(document.getElementById("cpuMicroCloud0"));
    
    RamSmoothies["ramMicroCloud0"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamSmoothies["ramMicroCloud0"].streamTo(document.getElementById("ramMicroCloud0"));


    CPUSmoothies["cpuMicroCloud1"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100, minValue: 0 });
    CPUSmoothies["cpuMicroCloud1"].streamTo(document.getElementById("cpuMicroCloud1"));

    RamSmoothies["ramMicroCloud1"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamSmoothies["ramMicroCloud1"].streamTo(document.getElementById("ramMicroCloud1"));


    CPUSmoothies["cpuMicroCloud2"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100, minValue: 0 });
    CPUSmoothies["cpuMicroCloud2"].streamTo(document.getElementById("cpuMicroCloud2"));

    RamSmoothies["ramMicroCloud2"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamSmoothies["ramMicroCloud2"].streamTo(document.getElementById("ramMicroCloud2"));



    CPUQuotaSmoothies["cpuQuotaMicroCloud0"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100000, minValue: 0 });
    CPUQuotaSmoothies["cpuQuotaMicroCloud0"].streamTo(document.getElementById("cpuQuotaMicroCloud0"));

    RamQuotaSmoothies["ramQuotaMicroCloud0"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamQuotaSmoothies["ramQuotaMicroCloud0"].streamTo(document.getElementById("ramQuotaMicroCloud0"));


    CPUQuotaSmoothies["cpuQuotaMicroCloud1"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100000, minValue: 0 });
    CPUQuotaSmoothies["cpuQuotaMicroCloud1"].streamTo(document.getElementById("cpuQuotaMicroCloud1"));

    RamQuotaSmoothies["ramQuotaMicroCloud1"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamQuotaSmoothies["ramQuotaMicroCloud1"].streamTo(document.getElementById("ramQuotaMicroCloud1"));


    CPUQuotaSmoothies["cpuQuotaMicroCloud2"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:13 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:100000, minValue: 0 });
    CPUQuotaSmoothies["cpuQuotaMicroCloud2"].streamTo(document.getElementById("cpuQuotaMicroCloud2"));

    RamQuotaSmoothies["ramQuotaMicroCloud2"] = new SmoothieChart({millisPerPixel: 100,labels:{fillStyle:'#000000'}, grid: { fillStyle:'#ffffff', millisPerLine: 5000, verticalSections:10 }, interpolation:'linear', timestampFormatter:SmoothieChart.timeFormatter, maxValue:2000, minValue: 0 });
    RamQuotaSmoothies["ramQuotaMicroCloud2"].streamTo(document.getElementById("ramQuotaMicroCloud2"));


    connect(); 
}

function connect() 
{
    var socket = io.connect("5.147.254.204:8082");
    socket.on('connect', function() 
    { 
        //sys.puts ('Conect from plot QuocDo');
        console.log('connected to server'); 
    });
    
    socket.on('disconnect', function() 
    { 
        console.log('disconnected from server'); 
        connect();
    });
    
    update(socket);
}

function updateTimeSeries(pid, plots, smoothie, x, y) 
{
    if (plots[pid] == undefined) 
    {
        plots[pid] = new TimeSeries()
        //smoothie[pid].addTimeSeries(plots[pid], { lineWidth:2, strokeStyle: rainbow(Object.keys(plots).length, Object.keys(plots).indexOf(pid)) });
        smoothie[pid].addTimeSeries(plots[pid], { lineWidth:2,strokeStyle:'rgba(0,0,0,0.91)',fillStyle:'rgba(0,0,0,0.30)' });
    }
    //smoothie[pid].addTimeSeries(plots[pid], { lineWidth:2,strokeStyle:'rgba(0,0,0,0.91)',fillStyle:'rgba(0,0,0,0.30)' });
    plots[pid].append(x, y);
}

function update(socket) 
{
    var CPUPlots = [];
    var RamPlots = [];     
    var CPUQuotaPlots = [];
    var RamQuotaPlots = [];

    socket.on('message', function(msg) 
    { 
        var lines = msg.split('\n');
        for (var i = 0; i < lines.length - 1; i++) 
        {
            //console.log(lines[i]);
            obj = JSON.parse(lines[i]);

            switch (obj.key) 
            {
                
                case 'resource-util':
                    updateTimeSeries("cpuMicroCloud0", CPUPlots, CPUSmoothies, new Date().getTime(), obj.cpu);
                    updateTimeSeries("ramMicroCloud0", RamPlots, RamSmoothies, new Date().getTime(), obj.ram);

                    updateTimeSeries("cpuMicroCloud1", CPUPlots, CPUSmoothies, new Date().getTime(), obj.cpu);
                    updateTimeSeries("ramMicroCloud1", RamPlots, RamSmoothies, new Date().getTime(), obj.ram);

                    updateTimeSeries("cpuMicroCloud2", CPUPlots, CPUSmoothies, new Date().getTime(), obj.cpu);
                    updateTimeSeries("ramMicroCloud2", RamPlots, RamSmoothies, new Date().getTime(), obj.ram);


                    //Quota
                    updateTimeSeries("cpuQuotaMicroCloud0", CPUQuotaPlots, CPUQuotaSmoothies, new Date().getTime(), obj.cpuquota);
                    updateTimeSeries("ramQuotaMicroCloud0", RamQuotaPlots, RamQuotaSmoothies, new Date().getTime(), obj.ramquota);

                    updateTimeSeries("cpuQuotaMicroCloud1", CPUQuotaPlots, CPUQuotaSmoothies, new Date().getTime(), obj.cpuquota);
                    updateTimeSeries("ramQuotaMicroCloud1", RamQuotaPlots, RamQuotaSmoothies, new Date().getTime(), obj.ramquota);

                    updateTimeSeries("cpuQuotaMicroCloud2", CPUQuotaPlots, CPUQuotaSmoothies, new Date().getTime(), obj.cpuquota);
                    updateTimeSeries("ramQuotaMicroCloud2", RamQuotaPlots, RamQuotaSmoothies, new Date().getTime(), obj.ramquota); 
                    //sys.puts(obj.cpu);
                    break;

            }
        }
    });
}

function rainbow(numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 400011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/400008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
    case 0: r = 1, g = f, b = 0; break;
    case 1: r = q, g = 1, b = 0; break;
    case 2: r = 0, g = 1, b = f; break;
    case 3: r = 0, g = q, b = 1; break;
    case 4: r = f, g = 0, b = 1; break;
    case 5: r = 1, g = 0, b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}
