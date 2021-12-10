FROM alfg/ffmpeg:latest as ffmpeg
FROM ejnshtein/node-tdlib:latest

WORKDIR /usr/src/app/

ADD ./package.json ./tsconfig.json ./yarn.lock ./

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
COPY --from=ffmpeg /usr/lib/librav1e.so /usr/lib/librav1e.so
COPY --from=ffmpeg /usr/lib/libx265.so /usr/lib/
COPY --from=ffmpeg /usr/lib/libx265.so.* /usr/lib/

ENV PATH=/opt/ffmpeg/bin:$PATH

RUN yarn install --network-timeout 1000000000

ADD ./assets ./assets
ADD ./src ./src
ADD ./types ./types

RUN yarn build-ts

CMD [ "yarn", "start" ]