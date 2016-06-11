var windowDuration = 20000;
var windowStart = 0;

function refreshCanvas(events, currentpos) {
  try {
    var windowTime = getWindowTimeRange(events);
    canvasFragmentUpdate($('#canvas_fragments')[0], windowTime.min, windowTime.max, events.fragments, currentpos);
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
