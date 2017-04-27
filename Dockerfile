FROM ruby:2.3.1-alpine

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    tzdata

WORKDIR /app/

COPY . /app/

RUN bundle install

RUN npm install

RUN npm install -g bower grunt

RUN bundle exec rake bower:install

RUN grunt
