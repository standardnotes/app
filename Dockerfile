FROM ruby:2.7.1-alpine

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    python2 \
    git \
    nodejs-npm \
    tzdata

WORKDIR /app/

COPY package.json package-lock.json Gemfile Gemfile.lock /app/

COPY vendor /app/vendor

RUN npm ci

RUN gem install bundler && bundle install

COPY . /app/

RUN npm run bundle

RUN bundle exec rails assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]
