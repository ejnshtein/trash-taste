FROM alfg/ffmpeg:latest as ffmpeg
# FROM ejnshtein/tdlib:latest as tdlib
FROM node:20-alpine3.16 as base

RUN npm i -g pnpm@^9

WORKDIR /app

# set tdlib
# COPY --from=tdlib /usr/local/lib/libtdjson.so ./libtdjson.so

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
  x265-dev \
  lame-dev

# copy ffmpeg
COPY --from=ffmpeg /opt/ffmpeg /opt/ffmpeg
COPY --from=ffmpeg /usr/lib/libfdk-aac.so.2 /usr/lib/libfdk-aac.so.2
COPY --from=ffmpeg /usr/lib/librav1e.so /usr/lib/librav1e.so
COPY --from=ffmpeg /usr/lib/libx265.so /usr/lib/
COPY --from=ffmpeg /usr/lib/libx265.so.* /usr/lib/

ENV PATH=/opt/ffmpeg/bin:$PATH

ADD ./package.json ./tsconfig.json ./pnpm-lock.yaml ./

ENV CI=true
RUN pnpm install

ADD ./assets ./assets
ADD ./src ./src
ADD ./types ./types

RUN pnpm build-ts

CMD [ "pnpm", "start" ]