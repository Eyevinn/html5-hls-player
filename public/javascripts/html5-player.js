jQuery.extend({
  getQueryParameters : function(str) {
    return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});

$(document).ready(playVideo);
var source, player;
var exampleManifest = "http://csm-e.cds1.yospace.com/csm/live/119101367.m3u8";

function playVideo() {
  var params = $.getQueryParameters();
  if (params.preload) {
    $('#manifestUrl').val(exampleManifest);
  }
  source = $('#manifestUrl').val();
  if(source) {
    play(source);
  }
}

function play(videosrc) {
  player = document.getElementById('video-container');
  var hls = new Hls();
  $('#data_version').html("hls.js " + Hls.version); 
  hls.loadSource(videosrc);
  hls.attachMedia(player);
  hls.on(Hls.Events.MANIFEST_PARSED, function(ev, data) {
    initQualitySelector(hls, data.levels);
    player.play();
  });

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

function qos_events(ev) {
  $('#data_qualityevents').html(ev.type);
}
