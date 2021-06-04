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


FROM alpine:latest as packager

RUN apk --no-cache add openjdk11-jdk openjdk11-jmods

ENV JAVA_MINI="/opt/java-mini"

# mini JRE
RUN /usr/lib/jvm/java-11-openjdk/bin/jlink \
    --verbose \
    --add-modules \
        java.base,java.naming,java.desktop,java.management,java.security.jgss,java.instrument \
    --compress 2 --strip-debug --no-header-files --no-man-pages \
    --release-info="add:IMPLEMENTOR=camunda:IMPLEMENTOR_VERSION=camunda_JRE" \
    --output "$JAVA_MINI"

# ===== END BUILD STAGE ====

FROM alpine:latest
RUN apk -U upgrade --no-cache 
# && apk add libcap

ENV JAVA_HOME="/opt/java-mini"
ENV PATH="$PATH:$JAVA_HOME/bin"
COPY --from=packager "$JAVA_HOME" "$JAVA_HOME"

# Enable non-root processes to bind to ports <1024
# RUN setcap 'cap_net_bind_service=+ep' "$JAVA_HOME"

COPY --from=builder /build/backend/target/start-camunda-0.0.1-SNAPSHOT.jar /

CMD java -jar -Dserver.port=80 /start-camunda-0.0.1-SNAPSHOT.jar

# alpine has no www-data user
RUN addgroup -S -g 82 www-data \
 && adduser -S -D -u 82 -G www-data www-data
USER www-data

EXPOSE 80 
