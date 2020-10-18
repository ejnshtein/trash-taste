FROM node:14-alpine

WORKDIR .

ADD . .

RUN yarn install --network-timeout 100000

RUN yarn build-ts

CMD [ "yarn", "start" ]