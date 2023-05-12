FROM maven:3.8.5-openjdk-17-slim as builder

RUN apt-get update \
  && apt-get install wget curl ca-certificates rsync -y \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_VERSION=18.16.0
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} \
  && nvm use v${NODE_VERSION} \
  && nvm alias default v${NODE_VERSION}

WORKDIR /build/backend
ADD . /build 
RUN . "$NVM_DIR/nvm.sh" && mvn clean install -Djdk.lang.Process.launchMechanism=vfork


# ===== END BUILD STAGE ====

FROM openjdk:17-jdk-slim
RUN apt-get update \
  && apt-get install -y \
    libcap2-bin \
  && rm -rf /var/lib/apt/lists/*

# Enable non-root processes to bind to ports <1024
RUN setcap 'cap_net_bind_service=+ep' /usr/local/openjdk-17/bin/java

COPY --from=builder /build/backend/target/start-camunda-0.0.1-SNAPSHOT.jar /

CMD /usr/local/openjdk-17/bin/java -jar -Dserver.port=80 /start-camunda-0.0.1-SNAPSHOT.jar

USER www-data
EXPOSE 80 
