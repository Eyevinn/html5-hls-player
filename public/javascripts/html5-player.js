jQuery.extend({
  getQueryParameters : function(str) {
    return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});

$(document).ready(function() { playVideo(false); });
var source, player;
var exampleManifest = "http://csm-e.cds1.yospace.com/csm/live/119101367.m3u8";

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

function play(videosrc, debug) {
  player = document.getElementById('video-container');
  var hls = new Hls({debug: debug});
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

  player.addEventListener('timeupdate', function(ev) {
    var currentlev = hls.levels[hls.currentLevel];
    $('#data_bandwidth').html(currentlev.width + "x" + currentlev.height + " (" + currentlev.bitrate/1000 + ") kbps"); 
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
    var ptsdata = "<p>PTS: "+data.startPTS+" - "+data.endPTS+" ("+data.nb+" samples)</p>";
    ptsdata = ptsdata + "<p>DTS: "+data.startDTS+" - "+data.endDTS+" ("+data.nb+" samples)</p>";
    $('#textoverlay').html(ptsdata);
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
