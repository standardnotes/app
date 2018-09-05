###
# Build with 'docker build -t standard_notes_web.img .'
# Run with 'docker run -d -p 127.0.0.1:3000:3000 --name standard_notes_web --restart always standard_notes_web.img'
# If you need shell access, run 'docker exec -it standard_notes_web /bin/sh'
# Access from http://localhost:3000/
# Set up Nginx to terminate SSL with LetsEncrypt and proxy_pass to http://localhost:3000/
###

FROM ruby:alpine

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    nodejs-npm \
    tzdata

WORKDIR /app/

COPY . /app/

###
# Uncomment SECRET_KEY_BASE, RAILS_ENV, and [possibly] RAILS_SERVE_STATIC_FILES for production:
# ENV SECRET_KEY_BASE=[VALUE OF `bundle exec rake secret`]
#
# ENV RAILS_ENV=production
#
# ENV RAILS_SERVE_STATIC_FILES=true
# Leave RAILS_SERVE_STATIC_FILES commented out if Nginx will serve your static files in production.
###

RUN bundle install

RUN npm install

RUN npm install -g bower grunt

RUN bundle exec rake bower:install

RUN npm run build

# Uncomment the line below for production:
# RUN bundle exec rake assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint" ]

CMD [ "start" ]
