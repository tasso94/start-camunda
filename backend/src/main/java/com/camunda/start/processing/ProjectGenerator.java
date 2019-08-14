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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    this.context = new HashMap<>();
    initContext(context);
    this.templateProcessor = new TemplateProcessor(context);
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

  protected List<Dependency> getDeps(Set<String> modules) {
    List<Dependency> dependencies = new ArrayList<>();

    modules.forEach(module -> {
      switch (module) {
        case "camunda-webapps":

          Dependency camundaWebapps = new Dependency()
              .setGroup("camunda-webapps-group")
              .setArtifact("camunda-webapps-artifact")
              .setVersion("camunda-webapps-version");

          dependencies.add(camundaWebapps);
          break;
        case "camunda-rest":

          Dependency camundaRest = new Dependency()
              .setGroup("camunda-rest-group")
              .setArtifact("camunda-rest-artifact")
              .setVersion("camunda-rest-version");

          dependencies.add(camundaRest);
          break;
        case "spring-boot-security":

          Dependency springSecurity = new Dependency()
              .setGroup("spring-security-group")
              .setArtifact("spring-security-artifact")
              .setVersion("spring-security-version");

          dependencies.add(springSecurity);
          break;
        case "spring-boot-web":

          Dependency springWeb = new Dependency()
              .setGroup("spring-web-group")
              .setArtifact("spring-web-artifact")
              .setVersion("spring-web-version");

          dependencies.add(springWeb);
          break;
        default:
          throw new RuntimeException("Unknown module!");
      }
    });

    return dependencies;
  }

  protected String getDbClassRef(String database) {
    switch (database.toLowerCase()) {
      case "postgresql":
        return "org.postgres.bla";
      case "h2":
        return "org.h2.bla";
      case "mysql":
        return "org.mySQl.bla";
      default:
        throw new RuntimeException("Unknown database!");
    }
  }

  protected String dotToSlash(String input) {
    return input.replace(".", "/");
  }

}
