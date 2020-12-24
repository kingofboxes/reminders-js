FROM postgres:latest
ENV POSTGRES_USER docker
ENV POSTGRES_PASSWORD docker
ENV POSTGRES_DB reminders
ADD schema.sql /docker-entrypoint-initdb.d/