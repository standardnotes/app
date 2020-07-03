###
# Build with 'docker build -t standard_notes_web.img .'
# Run with 'docker run -d -p 127.0.0.1:3000:3000 --name standard_notes_web --restart always standard_notes_web.img'
# If you need shell access, run 'docker exec -it standard_notes_web /bin/sh'
# Access from http://localhost:3000/
# Set up Nginx to terminate SSL with LetsEncrypt and proxy_pass to http://localhost:3000/
###

FROM ruby:2.7.1-alpine

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    nodejs-npm \
    tzdata

WORKDIR /app/

COPY . /app/

###
# FOR PRODUCTION USE:
#
# If you need the app to continue listening on HTTP instead of HTTPS
# (like terminating SSL on upstream server, i.e. Nginx proxy_pass to HTTP),
# you will need to set 'config.force_ssl = false' in 'config/environments/production.rb'.
#
# Uncomment SECRET_KEY_BASE, RAILS_ENV, and [optionally] RAILS_SERVE_STATIC_FILES for production:
# ENV SECRET_KEY_BASE=[VALUE OF `bundle exec rake secret`]
#
# ENV RAILS_ENV=production
#
# ENV RAILS_SERVE_STATIC_FILES=true
# Leave RAILS_SERVE_STATIC_FILES commented if Nginx/Apache will serve static files instead of rails.
###

RUN npm run build

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint" ]

CMD [ "start" ]
