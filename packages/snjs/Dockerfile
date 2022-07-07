FROM node:16.15.1-alpine AS builder

# Install dependencies for building native libraries
RUN apk add --update git openssh-client python3 alpine-sdk

WORKDIR /workspace

# docker-build plugin copies everything needed for `yarn install` to `manifests` folder.
COPY manifests ./

RUN yarn install --immutable

FROM node:16.15.1-alpine

RUN apk add --update curl

WORKDIR /workspace

# Copy the installed dependencies from the previous stage.
COPY --from=builder /workspace ./

# docker-build plugin runs `yarn pack` in all workspace dependencies and copies them to `packs` folder.
COPY packs ./

CMD [ "yarn", "start:test-server" ]
