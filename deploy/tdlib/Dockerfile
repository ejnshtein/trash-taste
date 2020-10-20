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
RUN cmake --build . --target install -j $(nproc)