FROM maven:3.6-slim as builder

RUN apt-get update \
  && apt-get install wget curl ca-certificates rsync -y \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_VERSION=10.16.3
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} \
  && nvm use v${NODE_VERSION} \
  && nvm alias default v${NODE_VERSION}

WORKDIR /build/backend
ADD . /build 
RUN . "$NVM_DIR/nvm.sh" && mvn clean install


# ===== END BUILD STAGE ====


FROM openjdk:11-jdk-slim
COPY --from=builder /build/backend/target/start-camunda-0.0.1-SNAPSHOT.jar /

CMD java -jar /start-camunda-0.0.1-SNAPSHOT.jar
USER www-data
EXPOSE 9090
