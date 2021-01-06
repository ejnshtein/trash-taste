FROM alfg/ffmpeg:latest as ffmpeg
FROM ejnshtein/node-tdlib:latest

WORKDIR /usr/src/app/

ADD ./src ./src
ADD ./forever.json .
ADD ./package.json .
ADD ./tsconfig.json .
ADD ./yarn.lock .

# set tdlib
RUN cp /usr/local/lib/libtdjson.so ./libtdjson.so

# set ffmpeg deps
RUN apk add --update \
  ca-certificates \
  openssl \
  pcre \
  lame \
  libogg \
  libass \
  libvpx \
  libvorbis \
  libwebp \
  libtheora \
  opus \
  rtmpdump \
  x264-dev \
  x265-dev

# copy ffmpeg
COPY --from=ffmpeg /opt/ffmpeg /opt/ffmpeg
COPY --from=ffmpeg /usr/lib/libfdk-aac.so.2 /usr/lib/libfdk-aac.so.2
COPY --from=ffmpeg /usr/lib/librav1e.so.0 /usr/lib/librav1e.so.0
COPY --from=ffmpeg /usr/lib/libx265.so.179  /usr/lib/libx265.so.179

ENV PATH=/opt/ffmpeg/bin:$PATH

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]