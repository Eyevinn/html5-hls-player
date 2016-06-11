var windowDuration = 20000;
var windowStart = 0;

var pipeline_timer;

function refreshCanvas(events, pipeline, currentpos) {
  try {
    var windowTime = getWindowTimeRange(events);
    canvasFragmentUpdate($('#canvas_fragments')[0], windowTime.min, windowTime.max, events.fragments, currentpos);
    if (!pipeline_timer) {
      pipeline_timer = setInterval(function() {
        canvasPipelineUpdate($('#canvas_pipeline')[0], pipeline);
      }, 500);
    }
  } catch (err) {
    console.log("refreshCanvas error: " + err.message);
  }
}

function getWindowTimeRange(events) {
  var tnow, minTime, maxTime;
  if(events.fragments.length) {
    tnow = events.fragments[events.fragments.length-1].time;
  } else {
    tnow = 0;
  }
  if(windowDuration) {
    minTime = Math.max(0, tnow-windowDuration);
    maxTime = Math.min(minTime + windowDuration, tnow);
  } else {
    minTime = 0;
    maxTime = tnow;
  }
  return { min: minTime, max: maxTime, now: tnow };
}

function canvasFragmentUpdate(canvas, minTime, maxTime, fragments, currentpos) {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var xaxispos = 15;
  var margin = 10;
  var intervals = 5;
  var axislength = canvas.width-margin;
  var axisdur = maxTime - minTime;

  // Draw axis
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height-xaxispos);
  ctx.lineTo(axislength, canvas.height-xaxispos);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height-xaxispos);
  ctx.lineTo(margin, margin);
  ctx.stroke();

  // Draw playhead
  ctx.beginPath();
  currentpos = currentpos-minTime;
  ctx.moveTo(margin + (axislength*currentpos/axisdur), canvas.height-xaxispos-15);
  ctx.lineTo(margin + (axislength*currentpos/axisdur), margin+15);
  ctx.stroke();
  ctx.fillText(Math.round(currentpos) + "ms", margin+(axislength*currentpos/axisdur)-30, canvas.height-xaxispos-5);
  
  // Draw timeline
  ctx.font = "8px Verdana";
  ctx.fillStyle = "black";
  ctx.fillText(Math.round(minTime), margin, canvas.height-xaxispos+10);
  ctx.fillText(Math.round(maxTime), canvas.width-margin-20, canvas.height-xaxispos+10);

  ctx.fillText("Fragments appended into SourceBuffer", margin+5, 10);
  // Draw bps for last fragment
  var frag = fragments[fragments.length-1]; 
  if(frag && frag.bw) {
    ctx.fillText(Math.round(frag.bw/1000) + " kbps", canvas.width-margin-40, 10); 
    ctx.fillText(Math.round(frag.size/1024) + " KB", canvas.width-margin-40, 20);
  }

  for(var i=1; i<intervals; i++) {
    var t = i*Math.round(axisdur/intervals); 
    var xpos = axislength*t / axisdur;
    ctx.fillText(Math.round(minTime + t), xpos, canvas.height-xaxispos+10); 
  }

  // console.log("minTime: " + minTime + ", maxTime: " + maxTime);
  for(var i=0; i<fragments.length; i++) {
    var e = fragments[i];
    var start = Math.round(e.time);
    var end = Math.round(e.time + e.duration + e.latency);
    if((start >= minTime && start <= maxTime)) {
      // Draw fragment if it is in a visible window
      canvasDrawFragment(ctx, e, margin, axisdur, axislength, minTime);
    }
/*
    if(!(start >= minTime)) {
      console.log("Not showing "+e.id2+", "+start+">="+minTime);
    }
    if(!(start <= maxTime)) {
      console.log("Not showing "+e.id2+", "+start+"<="+maxTime);
    }
*/
  }
}

function canvasDrawFragment(ctx, frag, margin, axisdur, axislength, minTime) {
  var h = 10;
  var ypos = 50 + (frag.id*h+5);
  var xpos;
  var x_w;
  //console.log(frag);

  // Download rectangle
  ctx.fillStyle = "green";
  xpos = margin + axislength*(frag.time+frag.latency-minTime) / axisdur;
  x_w = axislength*frag.load/axisdur;
  ctx.fillRect(xpos, ypos, x_w, h);
  ctx.fillText(frag.id2, xpos, ypos+20);

}

function canvasPipelineUpdate(canvas, pipeline) {
  var ctx = canvas.getContext('2d');
  var margin = 10;
  var t = performance.now() - pipeline.t0;
  var minTime = t;
  var maxTime = t + 500;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black"; 
  ctx.font = "8px Verdana";
  ctx.fillText(Math.round(minTime) + "-" + Math.round(maxTime) + " (ms)", margin+5, 10);

  ctx.strokeRect(margin+20, margin+30, 100, 90);
  ctx.fillText("Manifest Loader", margin+20+15, margin+30+10);
  ctx.strokeRect(margin+20+100, margin+30+30, 80, 20);

  ctx.strokeRect(margin+200, margin+30, 100, 90);
  ctx.fillText("Fragment Parser", margin+200+15, margin+30+10);
  ctx.strokeRect(margin+200+100, margin+30+30, 80, 20);
 
  ctx.strokeRect(margin+380, margin+30, 100, 90);
  ctx.fillText("TS Demuxer", margin+380+15, margin+30+10);
  ctx.strokeRect(margin+380+100, margin+30+30, 80, 20);
   
  ctx.strokeRect(margin+560, margin+30, 100, 90);
  ctx.fillText("MP4 Remuxer", margin+560+15, margin+30+10);
  ctx.strokeRect(margin+560+100, margin+30+30, 80, 20);

  ctx.strokeRect(margin+740, margin+30, 200, 150);
  ctx.fillText("Source Buffer", margin+740+15, margin+30+10);

  var requested = [];
  var loaded = [];
  var parsed = [];
  var buffered = [];
  var insource = [];

  for (var i=0; i<pipeline.fragments.length; i++) {
    var f = pipeline.fragments[i];
    if (f.requested >= minTime && f.requested <= maxTime) {
      requested.push(f);
    } 
    if (f.loaded >= minTime && f.loaded <= maxTime) {
      loaded.push(f);
    } 
    if (f.parsed >= minTime && f.parsed <= maxTime) {
      parsed.push(f);
    } 
    if (f.buffered >= minTime && f.buffered <= maxTime) {
      buffered.push(f);
    }
    if (minTime > 3000 && f.buffered >= minTime-3000 && f.buffered <= maxTime+3000) {
      insource.push(f);
    }
  }
  requested.sort(function(a, b) { return b.id2 - a.id2 });
  loaded.sort(function(a, b) { return b.id2 - a.id2 });
  parsed.sort(function(a, b) { return b.id2 - a.id2 });
  buffered.sort(function(a, b) { return b.id2 - a.id2 });

  var colors = {
    0: "blue",
    1: "green",
    2: "black",
    3: "red"
  };
  var w = 15;
  for(var i=0; i<requested.length; i++) {
    var f = requested[i];
    ctx.fillStyle = colors[f.color];
    ctx.fillRect(margin+120+(i*w), margin+30+30, w-2, w);
    ctx.fillStyle = "white";
    ctx.fillText(f.id2, margin+120+2+(i*w), margin+30+30+10);
  }
  for(var i=0; i<loaded.length; i++) {
    var f = loaded[i];
    ctx.fillStyle = colors[f.color];
    ctx.fillRect(margin+300+(i*w), margin+30+30, w-2, w);
    ctx.fillStyle = "white";
    ctx.fillText(f.id2, margin+300+2+(i*w), margin+30+30+10);
  }
  for(var i=0; i<parsed.length; i++) {
    var f = parsed[i];
    ctx.fillStyle = colors[f.color];
    ctx.fillRect(margin+480+(i*w), margin+30+30, w-2, w);
    ctx.fillStyle = "white";
    ctx.fillText(f.id2, margin+480+2+(i*w), margin+30+30+10);
  }
  for(var i=0; i<buffered.length; i++) {
    var f = buffered[i];
    ctx.fillStyle = colors[f.color];
    ctx.fillRect(margin+660+(i*w), margin+30+30, w-2, w);
    ctx.fillStyle = "white";
    ctx.fillText(f.id2, margin+660+2+(i*w), margin+30+30+10);
  }
  var count = 0;
  var row = 0;
  for(var i=0; i<insource.length; i++) {
    var f = insource[i];
    ctx.fillStyle = colors[f.color];
    ctx.fillRect(margin+840+(count*w), margin+35+(row*20), w-2, w);
    ctx.fillStyle = "white";
    ctx.fillText(f.id2, margin+840+2+(count*w), margin+35+(row*20)+10);
    count++;
    if (count > 5) {
      count = 0;
      row++;
    }
  }
}
