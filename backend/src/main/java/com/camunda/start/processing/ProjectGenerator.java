/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.camunda.start.processing;

import com.camunda.start.rest.dto.DownloadProjectDto;
import org.zeroturnaround.zip.ByteSource;
import org.zeroturnaround.zip.ZipEntrySource;
import org.zeroturnaround.zip.ZipUtil;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ProjectGenerator {

  protected static final String MAIN_PATH = "/src/main/";
  protected static final String JAVA_PATH = MAIN_PATH + "java/";
  protected static final String RESOURCES_PATH = MAIN_PATH + "resources/";

  protected static final String APPLICATION_CLASS_NAME = "Application.java";
  protected static final String APPLICATION_YAML_NAME = "application.yaml";
  protected static final String APPLICATION_POM_NAME = "pom.xml";

  protected static final String TEMPLATES_PATH = "/com/camunda/start/templates/";

  protected DownloadProjectDto dto;
  protected TemplateProcessor templateProcessor;
  protected Map<String, Object> context;

  public ProjectGenerator(DownloadProjectDto dto) {
    this.dto = dto;
    initDto(dto);
    this.context = new HashMap<>();
    initContext(context);
    this.templateProcessor = new TemplateProcessor(context);
  }

  protected void initDto(DownloadProjectDto dto) {
    if (isEmpty(dto.getModules())) {
      dto.setModules(Collections.singletonList("camunda-rest"));
    }
    if (isEmpty(dto.getGroup())) {
      dto.setGroup("com.example.workflow");
    }
    if (isEmpty(dto.getDatabase())) {
      dto.setDatabase("postgresql");
    }
    if (isEmpty(dto.getArtifact())) {
      dto.setArtifact("my-project");
    }
    if (isEmpty(dto.getCamundaVersion())) {
      dto.setCamundaVersion("7.12.0-SNAPSHOT");
    }
    if (isEmpty(dto.getJavaVersion())) {
      dto.setJavaVersion("12");
    }
    if (isEmpty(dto.getUsername())) {
      dto.setUsername("demo");
    }
    if (isEmpty(dto.getPassword())) {
      dto.setPassword("demo");
    }
    if (isEmpty(dto.getVersion())) {
      dto.setVersion("1.0.0-SNAPSHOT");
    }
    if (isEmpty(dto.getSpringBootVersion())) {
      dto.setSpringBootVersion("2.1.6.RELEASE");
    }
  }

  private boolean isEmpty(String string) {
    return string == null || string.isEmpty();
  }

  private boolean isEmpty(List<String> set) {
    return set == null || set.isEmpty();
  }

  public byte[] generate() {
    byte[] applicationClass = processByFileName(APPLICATION_CLASS_NAME);
    byte[] applicationYaml = processByFileName(APPLICATION_YAML_NAME);
    byte[] pomXml = processByFileName(APPLICATION_POM_NAME);

    String projectName = (String) context.get("artifact");
    String packageName = dotToSlash(dto.getGroup());

    ZipEntrySource[] entries = new ZipEntrySource[] {
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + APPLICATION_CLASS_NAME, applicationClass),
        new ByteSource(projectName + RESOURCES_PATH + APPLICATION_YAML_NAME, applicationYaml),
        new ByteSource(projectName + "/" + APPLICATION_POM_NAME, pomXml)
    };

    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    ZipUtil.pack(entries, baos);

    return baos.toByteArray();
  }

  public String generate(String fileName) {
    return templateProcessor.process(TEMPLATES_PATH + fileName + ".vm");
  }

  protected byte[] processByFileName(String filename) {
    return templateProcessor.process(TEMPLATES_PATH + filename + ".vm")
        .getBytes();
  }

  protected void initContext(Map<String, Object> context) {
    context.put("packageName", dto.getGroup());

    context.put("dbType", dto.getDatabase());
    context.put("dbClassRef", getDbClassRef(dto.getDatabase()));

    context.put("adminUsername", dto.getUsername());
    context.put("adminPassword", dto.getPassword());

    context.put("camundaVersion", dto.getCamundaVersion());
    context.put("springBootVersion", dto.getSpringBootVersion());
    context.put("javaVersion", dto.getJavaVersion());

    context.put("group", dto.getGroup());
    context.put("artifact", dto.getArtifact());
    context.put("projectVersion", dto.getVersion());

    context.put("dependencies", getDeps(dto.getModules()));
  }

  protected List<Dependency> getDeps(List<String> modules) {
    List<Dependency> dependencies = new ArrayList<>();

    modules.forEach(module -> {
      switch (module) {
        case "camunda-webapps":

          Dependency camundaWebapps = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter-webapp")
              .setVersion(getVersion(dto.getCamundaVersion()));

          dependencies.add(camundaWebapps);
          break;
        case "camunda-rest":

          Dependency camundaRest = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter-rest")
              .setVersion(getVersion(dto.getCamundaVersion()));

          dependencies.add(camundaRest);
          break;
        case "spring-boot-security":

          Dependency springSecurity = new Dependency()
              .setGroup("org.springframework.boot")
              .setArtifact("spring-boot-starter-security");

          dependencies.add(springSecurity);
          break;
        case "spring-boot-web":

          Dependency springWeb = new Dependency()
              .setGroup("org.springframework.boot")
              .setArtifact("spring-boot-starter-web");

          dependencies.add(springWeb);
          break;
        default:
          throw new RuntimeException("Unknown module!");
      }
    });

    addJdbcDependency(dto.getDatabase(), dependencies);

    return dependencies;
  }

  protected void addJdbcDependency(String database, List<Dependency> dependencies) {
    Dependency jdbcDependency = null;

    switch (database) {
      case "postgresql":
        jdbcDependency = new Dependency()
            .setGroup("org.postgresql")
            .setArtifact("postgresql");
        break;
      case "mysql":
        jdbcDependency = new Dependency()
            .setGroup("mysql")
            .setArtifact("mysql-connector-java");
        break;
      case "h2":
        jdbcDependency = new Dependency()
            .setGroup("com.h2database")
            .setArtifact("h2");
        break;
      default:
        throw new RuntimeException("Unknown database!");
    }

    dependencies.add(jdbcDependency);
  }

  protected String getVersion(String camundaVersion) {
    switch (camundaVersion) {
      case "7.9.0":
        return "3.0.3";
      case "7.10.0":
        return "3.2.5";
      case "7.11.0":
        return "3.3.3";
      case "7.12.0-SNAPSHOT":
        return "3.4.0-SNAPSHOT";
    }
    return null;
  }

  protected String getDbClassRef(String database) {
    switch (database.toLowerCase()) {
      case "postgresql":
        return "org.postgresql.jdbc2.optional.SimpleDataSource";
      case "mysql":
        return "com.mysql.cj.jdbc.MysqlDataSource";
      default:
        return "";
    }
  }

  protected String dotToSlash(String input) {
    return input.replace(".", "/");
  }

}
