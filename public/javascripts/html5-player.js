jQuery.extend({
  getQueryParameters : function(str) {
    return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});

function secondsToSMPTE(seconds, framerate) {
    var f = Math.floor((seconds % 1) * framerate);
    var s = Math.floor(seconds);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    m = m % 60;
    s = s % 60;

    return {h: h, m: m, s: s, f: f};
}

/** Pretty print SMPTE timecode JSON object */
function SMPTEToString(timecode) {
    if (timecode.h < 10) { timecode.h = "0" + timecode.h; }
    if (timecode.m < 10) { timecode.m = "0" + timecode.m; }
    if (timecode.s < 10) { timecode.s = "0" + timecode.s; }
    if (timecode.f < 10) { timecode.f = "0" + timecode.f; }

    return timecode.h + ":" + timecode.m + ":" + timecode.s + ":" + timecode.f;
}


$(document).ready(function() { playVideo(false); });
var source, player;
var exampleManifest = "http://csm-e.cds1.yospace.com/csm/live/119101367.m3u8";
var totalDuration;

function playVideo(dodebug) {
  var params = $.getQueryParameters();
  if (params.preload) {
    $('#manifestUrl').val(exampleManifest);
  }
  source = $('#manifestUrl').val();
  if(source) {
    play(source, dodebug);
  }
}

function toggleOverlay() {
  var overlay = $('#textoverlay');
  if(overlay.css("display") == "none") {
    overlay.css("display", "block");
  } else {
    overlay.css("display", "none");
  }
}

function play(videosrc, debug) {
  player = document.getElementById('video-container');
  var hls = new Hls({
    debug: debug
  });
  $('#data_version').html("hls.js " + Hls.version); 
  if(debug) {
    $('#textoverlay').css("display", "block");
  }
  hls.loadSource(videosrc);
  hls.attachMedia(player);
  hls.on(Hls.Events.MANIFEST_PARSED, function(ev, data) {
    initQualitySelector(hls, data.levels);
    player.play();
  });
  hls.on(Hls.Events.FRAG_LOADING, frag_events);
  hls.on(Hls.Events.FRAG_LOAD_PROGRESS, frag_events);
  hls.on(Hls.Events.FRAG_LOADED, frag_events);
  hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, frag_events);
  hls.on(Hls.Events.FRAG_PARSING_DATA, frag_events);
  hls.on(Hls.Events.FRAG_PARSED, frag_events);
  hls.on(Hls.Events.FRAG_BUFFERED, frag_events);
  hls.on(Hls.Events.ERROR, error_events);
  hls.on(Hls.Events.LEVEL_LOADED, function(ev, data) {
    if(!data.details.live) {
      totalDuration = data.details.totalduration;
    } else {
      totalDuration = -1;
    }
  });

  player.addEventListener('timeupdate', function(ev) {
    if (hls.currentLevel > 0) {
      var currentlev = hls.levels[hls.currentLevel];
      $('#data_bandwidth').html(currentlev.width + "x" + currentlev.height + " (" + currentlev.bitrate/1000 + ") kbps"); 
    }
    $('#overlay_timedata').html(SMPTEToString(secondsToSMPTE(player.currentTime, 25))+" / " + (totalDuration == -1 ? "LIVE" : SMPTEToString(secondsToSMPTE(totalDuration, 25))));
  });
  player.addEventListener('error', qos_events);
  player.addEventListener('progress', qos_events);
  player.addEventListener('waiting', qos_events);
  player.addEventListener('stalled', qos_events);
  player.addEventListener('playing', qos_events);
  player.addEventListener('ratechange', qos_events);
}

function initQualitySelector(hls, levels) {
  var sel = $("#level");
  sel.empty();
  var defopt = $('<option></option>').attr("value", "auto").text("Auto");
  defopt.attr('selected', true);
  sel.append(defopt);
  var quality_html = '';
  for (l=0; l<levels.length; l++) {
    var lev = levels[l];
    var option = $('<option></option>').attr("value", l).text(lev.width + "x" + lev.height + " ("+lev.bitrate/1000+" kbps)");
    sel.append(option);
    quality_html = quality_html + lev.width + "x" + lev.height + " ("+ Math.round(lev.bitrate/1000)  +" kbps)<br>";
  }
  $('#data_qualitylevels').html(quality_html);
  sel.on("change", function(ev) {
    if(ev.target.value != "auto") {
      hls.loadLevel = ev.target.value;
    } else {
      hls.loadLevel = -1;
    } 
  });
}

function error_events(ev, data) {
  var errmsg = data.type + ": " + data.details;
  if (data.type == Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
    errmsg = errmsg + " ("+ data.hole +")";
  }
  $('#data_error').html(errmsg);
}

function frag_events(ev, data) {
  var fragevents = {};
  fragevents[Hls.Events.FRAG_LOADING] = 'Loading fragment';
  fragevents[Hls.Events.FRAG_LOAD_PROGRESS] = 'Fragment load in progress';
  fragevents[Hls.Events.FRAG_LOADED] = 'Fragment loaded';
  fragevents[Hls.Events.FRAG_PARSING_INIT_SEGMENT] = 'ID3 parsing completed';
  fragevents[Hls.Events.FRAG_PARSING_DATA] = 'moof/mdat extracted';
  fragevents[Hls.Events.FRAG_PARSED] = 'Fragment parsed';
  fragevents[Hls.Events.FRAG_BUFFERED] = 'Remuxed MP4 boxes appended to buffer';
  $('#data_fragevents').html(fragevents[ev]);
  if (ev == Hls.Events.FRAG_PARSING_DATA && data.type == 'video') {
    var ptsdata = "<p>HLS: PTS: "+parseFloat(data.startPTS).toFixed(3)+" - "+parseFloat(data.endPTS).toFixed(3)+" ("+data.nb+" samples)";
    ptsdata = ptsdata + ", DTS: "+parseFloat(data.startDTS).toFixed(3)+" - "+parseFloat(data.endDTS).toFixed(3)+" ("+data.nb+" samples)</p>";
    $('#overlay_ptsdata').html(ptsdata);
  }
  if (ev == Hls.Events.FRAG_LOADED) {
    var fraginfo = '';
    for(i=0; i<data.frag.tagList.length; i++) {
      var tag = data.frag.tagList[i];
      var filename = data.frag.url.substring(data.frag.url.lastIndexOf('/')+1);
      fraginfo = fraginfo + "" + data.frag.loadIdx+":"+tag[0]+" ("+parseFloat(data.frag.duration).toFixed(2)+" sec / "+data.stats.total+" bytes / "+filename+")<br>";
    }
    $('#data_fragment').html(fraginfo);
  }
}

function qos_events(ev) {
  var qosevents = {};
  qosevents['progress'] = "Buffering video data";
  qosevents['waiting'] = "Waiting for requested video data";
  qosevents['stalled'] = "Buffering stalled";
  qosevents['error'] = "Error occured while loading video";
  qosevents['playing'] = "Playback resumed following paused or download delay";
  qosevents['ratechange'] = "Playback rate has changed";
  $('#data_qualityevents').html(qosevents[ev.type]);
}
