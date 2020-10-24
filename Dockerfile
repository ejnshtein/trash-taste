FROM jrottenberg/ffmpeg:4.3.1-alpine311 as ffmpeg
FROM ejnshtein/node-tdlib:14-1.6.0-alpine-3.12.0

WORKDIR /usr/src/app/

ADD . .

RUN cp /usr/local/lib/libtdjson.so ./libtdjson.so

COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /usr/local/bin/ffprobe /usr/local/bin/ffprobe

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]