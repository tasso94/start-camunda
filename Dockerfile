FROM maven:3.6-slim as builder

RUN apt-get update \
  && apt-get install wget curl ca-certificates rsync -y \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_VERSION=13.11.0
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
RUN apt-get update \
  && apt-get install -y \
    libcap2-bin \
  && rm -rf /var/lib/apt/lists/*

# Enable non-root processes to bind to ports <1024
RUN setcap 'cap_net_bind_service=+ep' /usr/local/openjdk-11/bin/java

COPY --from=builder /build/backend/target/start-camunda-0.0.1-SNAPSHOT.jar /

CMD /usr/local/openjdk-11/bin/java -jar -Dserver.port=80 /start-camunda-0.0.1-SNAPSHOT.jar

USER www-data
EXPOSE 80 
