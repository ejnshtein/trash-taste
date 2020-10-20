FROM node:14-alpine

WORKDIR /usr/src/app/

RUN pwd

ADD . .

RUN ls /usr/local/lib

# setup make
RUN apk add --update make

# setup gcc compiller
RUN apk add build-base

# setup python 2
RUN apk add --update --no-cache python3 && \
    ln -sf python3 /usr/bin/python && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade pip setuptools

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]