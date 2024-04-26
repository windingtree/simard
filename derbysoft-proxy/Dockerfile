FROM node:lts-alpine AS BUILD_IMAGE

ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

USER node

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app

WORKDIR /home/node/app

# install dependencies
COPY --chown=node:node .npmrc .npmrc 
COPY --chown=node:node package*.json ./

RUN npm install

# copy source files
COPY --chown=node:node tsconfig.build.json ./
COPY --chown=node:node ./src ./src
COPY --chown=node:node .env .env 

# build and prune
RUN npm run build
#; \
#    npm prune --production

# expose 
EXPOSE 5050

CMD [ "npm", "run", "start" ]