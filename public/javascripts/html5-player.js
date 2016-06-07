$(document).ready(playVideo);
var source, player;

function playVideo() {
  source = $('#manifestUrl').val();
  if(source) {
    vjsPlay(source);
    //hlsPlay(source);
  }
}

function hlsjs_initQualitySelector(hls) {
  var sel = $("#level");
  sel.empty();
  var defopt = $('<option></option>').attr("value", "auto").text("Auto");
  defopt.attr('selected', true);
  sel.append(defopt);
  for (l=0; l<hls.levels.length; l++) {
    var lev = hls.levels[l];
    var option = $('<option></option>').attr("value", l).text(lev.width + "x" + lev.height + " ("+lev.bitrate/1000+" kbps)");
    sel.append(option);
  }
  sel.on("change", function(ev) {
    if(ev.target.value != "auto") {
      hls.loadLevel = ev.target.value;
    } else {
      hls.loadLevel = -1;
    } 
  });
}

function hlsPlay(videosrc) {
  var player = document.getElementById('video-container');
  var hls = new Hls();
  hls.loadSource(videosrc);
  hls.attachMedia(player);
  hls.on(Hls.Events.MANIFEST_PARSED, function() {
    hlsjs_initQualitySelector(hls);
    player.play();
  });
  hls.on(Hls.Events.LEVEL_SWITCH, function(ev, data) {
    console.log(data);
  });
}

function vjsPlay(videosrc) {
  player = videojs('video-container');
  player.src({
    type: "application/x-mpegURL",
    src: videosrc
  });
  player.play();
}
