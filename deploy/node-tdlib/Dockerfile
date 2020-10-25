FROM ejnshtein/tdlib:1.6.0 as tdlib
FROM node:14-alpine

COPY --from=tdlib /usr/local/lib/* /usr/local/lib/

# setup python for node-ffi
RUN apk add --update --no-cache python3 make build-base && \
    ln -sf python3 /usr/bin/python && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade pip setuptools