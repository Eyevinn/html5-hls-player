FROM eyevinntechnology/node
MAINTAINER Eyevinn Technology (http://eyevinn.github.io)
RUN mkdir /root/source
RUN cd /root/source && \
  git clone https://github.com/Eyevinn/html5-hls-player.git
RUN cd /root/source/html5-hls-player && \
  npm install
EXPOSE 80
CMD cd /root/source/html5-hls-player && PORT=80 npm start
