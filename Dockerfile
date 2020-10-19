# build tdlib
FROM alpine:3.12.0 as builder

RUN apk add --update --no-cache \
  alpine-sdk \
  linux-headers \
  git \
  zlib-dev \
  openssl-dev \
  gperf \
  php \
  php-ctype \
  cmake

WORKDIR /tmp/_build_tdlib/

RUN git clone https://github.com/tdlib/td.git /tmp/_build_tdlib/ --branch v1.6.0

RUN mkdir build
WORKDIR /tmp/_build_tdlib/build/
RUN export CXXFLAGS=""
RUN cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX:PATH=/usr/local ..
RUN cmake --build  . --target install -j $(nproc)

RUN ls /usr/local/lib

# run application
FROM node:14-alpine

WORKDIR /usr/src/app/

COPY --from=builder /usr/local/lib/libtd* /usr/src/app/

ADD . .

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