# Start Camunda BPM

A Webapp to generate & customize your Camunda Spring Boot Starter project.

## Build & Run

Make sure you have npm and maven installed.

1. Go to the backend folder `cd ./backend`
2. Run `mvn clean install`
3. Run the Uber-Jar `java -jar ./target/start-camunda-0.0.1-SNAPSHOT.jar`
4. Open the following link in your browser: [http://localhost:9090](http://localhost:9090)

### Using docker
1. run `docker build . -t start-camunda`
2. run `docker run --rm -it -p9090:9090 start-camunda`
3. Open the following link in your browser: [http://localhost:9090](http://localhost:9090)

![Start Camunda BPM](./screenshot.png)
