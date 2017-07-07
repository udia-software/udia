# Elixir 1.4.2: https://hub.docker.com/_/elixir/
FROM elixir:1.4.2
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y install inotify-tools

# Set /app as workdir
RUN mkdir /app
ADD . /app
WORKDIR /app

RUN mix local.hex --force
RUN mix local.rebar --force

RUN mix archive.install https://github.com/phoenixframework/archives/raw/master/phx_new.ez --force
