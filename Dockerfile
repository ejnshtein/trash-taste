FROM mattiamari/tdlib as build-tdlib
FROM node:14-alpine

COPY --from=build-tdlib /tdlib/ /usr/local/

WORKDIR /usr/src/app/

ADD . /usr/src/app/

# setup make
RUN apk add --update make

# setup gcc compiller
RUN apk add build-base

# setup python 2
RUN apk add --no-cache python2 && \
    python -m ensurepip && \
    rm -r /usr/lib/python*/ensurepip && \
    pip install --upgrade pip setuptools && \
    rm -r /root/.cache

RUN yarn install --network-timeout 100000

RUN yarn build-ts

# CMD [ "yarn", "start" ]