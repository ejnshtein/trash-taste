FROM ejnshtein/node-tdlib:14-1.6.0-alpine-3.12.0

WORKDIR /usr/src/app/

ADD . .

RUN cp /usr/local/lib/libtdjson.so ./libtdjson.so

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]