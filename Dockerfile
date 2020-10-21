FROM ejnshtein/tdlib:1.0 as tdlib
FROM node:14-alpine

WORKDIR /usr/src/app/

ADD . .

COPY --from=tdlib /usr/local/lib/libtdjson.so .

# setup python for node-ffi
RUN apk add --update --no-cache python3 make build-base && \
    ln -sf python3 /usr/bin/python && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade pip setuptools

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]