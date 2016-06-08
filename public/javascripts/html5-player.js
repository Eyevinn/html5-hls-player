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
  $('#data_version').html("hls.js 0.5.34"); 
  hls.loadSource(videosrc);
  hls.attachMedia(player);
  hls.on(Hls.Events.MANIFEST_PARSED, function() {
    player.play();
  });

  player.addEventListener('timeupdate', function(ev) {
    var p = this;
/*
    var tech = p.tech({ IWillNotUseThisInPlugins: true });
    var hls = tech.hls;
    if(hls) {
      $('#data_bandwidth').html(Math.round(hls.stats.bandwidth / 8 / 1000) + " kbps ("+ Math.round(hls.stats.mediaBytesTransferred / 1024 / 1024) + " MB transferred)");
    } else {
      $('#data_bandwidth').html("n/a");
    }
    $('#data_currenttime').html(Math.round(tech.currentTime()) + " sec of " + tech.duration() + " sec");
    var buf = tech.buffered;
    $('#data_buffered').html(buf.length + " ranges buffered");
*/
  });
  player.addEventListener('error', qos_events);
  player.addEventListener('progress', qos_events);
  player.addEventListener('waiting', qos_events);
  player.addEventListener('stalled', qos_events);
  player.addEventListener('playing', qos_events);
  player.addEventListener('ratechange', qos_events);
}

function qos_events(ev) {
  $('#data_qualityevents').html(ev.type);
}
