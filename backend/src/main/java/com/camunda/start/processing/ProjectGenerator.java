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
import com.camunda.start.update.VersionUpdater;
import com.camunda.start.update.dto.StarterVersionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.zeroturnaround.zip.ByteSource;
import org.zeroturnaround.zip.ZipEntrySource;
import org.zeroturnaround.zip.ZipUtil;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ProjectGenerator {

  protected static final String MAIN_PATH = "/src/main/";
  protected static final String JAVA_PATH = MAIN_PATH + "java/";
  protected static final String RESOURCES_PATH = MAIN_PATH + "resources/";

  protected static final String TEST_MAIN_PATH = "/src/test/";
  protected static final String TEST_JAVA_PATH = TEST_MAIN_PATH + "java/";
  protected static final String TEST_RESOURCES_PATH = TEST_MAIN_PATH + "resources/";

  protected static final String APPLICATION_CLASS_NAME = "Application.java";
  protected static final String APPLICATION_YAML_NAME = "application.yaml";
  protected static final String APPLICATION_YAML_TEST_NAME = "application.yaml";
  protected static final String APPLICATION_POM_NAME = "pom.xml";
  protected static final String APPLICATION_BPMN_NAME = "process.bpmn";
  protected static final String APPLICATION_TEST_CASE_NAME = "WorkflowTest.java";
  protected static final String APPLICATION_LOGCONFIG_NAME = "logback-test.xml";

  protected static final String TEMPLATES_PATH = "/com/camunda/start/templates/";


  protected DownloadProjectDto inputData;
  protected Map<String, Object> templateContext;
  protected Map<String, StarterVersionDto> versions;

  @Autowired
  protected VersionUpdater versionUpdater;

  @Autowired
  protected TemplateProcessor templateProcessor;

  public byte[] generate(DownloadProjectDto inputData) {
    initialize(inputData);

    byte[] applicationClass = processByFileName(APPLICATION_CLASS_NAME);
    byte[] applicationYaml = processByFileName(APPLICATION_YAML_NAME);
    byte[] pomXml = processByFileName(APPLICATION_POM_NAME);
    byte[] processBpmn = processByFileName(APPLICATION_BPMN_NAME);

    String projectName = (String) templateContext.get("artifact");
    String packageName = dotToSlash((String) templateContext.get("group"));

    List<ZipEntrySource> entries = new ArrayList<>(Arrays.asList(
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + APPLICATION_CLASS_NAME, applicationClass),
        new ByteSource(projectName + RESOURCES_PATH + APPLICATION_YAML_NAME, applicationYaml),
        new ByteSource(projectName + "/" + APPLICATION_POM_NAME, pomXml),
        new ByteSource(projectName + RESOURCES_PATH + APPLICATION_BPMN_NAME, processBpmn)
    ));

    boolean isCamundaAssert = (boolean) templateContext.get("isCamundaAssert");
    if (isCamundaAssert) {
      byte[] logbackTestConfig = processByFileName(APPLICATION_LOGCONFIG_NAME);
      byte[] testCase = processByFileName(APPLICATION_TEST_CASE_NAME);
      byte[] applicationYamlTest = processByFileName(APPLICATION_YAML_TEST_NAME);

      entries.add(new ByteSource(projectName + TEST_JAVA_PATH + packageName + "/" + APPLICATION_TEST_CASE_NAME, testCase));
      entries.add(new ByteSource(projectName + TEST_RESOURCES_PATH + APPLICATION_LOGCONFIG_NAME, logbackTestConfig));
      entries.add(new ByteSource(projectName + TEST_RESOURCES_PATH + APPLICATION_YAML_TEST_NAME, applicationYamlTest));
    }

    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    ZipUtil.pack(entries.toArray(new ZipEntrySource[0]), baos);

    return baos.toByteArray();
  }

  public String generate(DownloadProjectDto inputData, String fileName) {
    initialize(inputData);

    return templateProcessor.process(templateContext, TEMPLATES_PATH + fileName + ".vm");
  }

  protected byte[] processByFileName(String filename) {
    return templateProcessor.process(templateContext,TEMPLATES_PATH + filename + ".vm")
        .getBytes();
  }

  public void initialize(DownloadProjectDto inputData) {
    this.inputData = inputData;

    versions = versionUpdater.getStarterVersionWrapper()
        .getStarterVersions()
        .stream()
        .collect(Collectors.toMap(StarterVersionDto::getStarterVersion,
            starterVersionDto -> starterVersionDto, (a, b) -> b, LinkedHashMap::new));

    addDefaultValues(inputData);

    templateContext = initTemplateContext(inputData);
  }

  protected void addDefaultValues(DownloadProjectDto inputData) {
    if (isEmpty(inputData.getModules())) {
      inputData.setModules(Collections.singletonList("camunda-base"));
    }
    if (isEmpty(inputData.getGroup())) {
      inputData.setGroup("com.example.workflow");
    }
    if (isEmpty(inputData.getPersistence())) {
      inputData.setPersistence("on-disk");
    }
    if (isEmpty(inputData.getArtifact())) {
      inputData.setArtifact("my-project");
    }
    if (isEmpty(inputData.getStarterVersion())) {
      String latestStarterVersion = versions.keySet()
          .iterator()
          .next();

      inputData.setStarterVersion(latestStarterVersion);
    }
    if (isEmpty(inputData.getJavaVersion())) {
      inputData.setJavaVersion("12");
    }
    if (isEmpty(inputData.getUsername())) {
      inputData.setUsername("demo");
    }
    if (isEmpty(inputData.getPassword())) {
      inputData.setPassword("demo");
    }
    if (isEmpty(inputData.getVersion())) {
      inputData.setVersion("1.0.0-SNAPSHOT");
    }
  }

  private boolean isEmpty(String string) {
    return string == null || string.isEmpty();
  }

  private boolean isEmpty(List<String> set) {
    return set == null || set.isEmpty();
  }

  protected Map<String, Object> initTemplateContext(DownloadProjectDto inputData) {
    Map<String, Object> context = new HashMap<>();
    context.put("packageName", inputData.getGroup());

    context.put("persistence", inputData.getPersistence());

    context.put("adminUsername", inputData.getUsername());
    context.put("adminPassword", inputData.getPassword());

    context.put("camundaVersion", resolveCamundaVersion(inputData.getStarterVersion()));
    context.put("springBootVersion", resolveSpringBootVersion(inputData.getStarterVersion()));
    context.put("javaVersion", inputData.getJavaVersion());

    context.put("group", inputData.getGroup());
    context.put("artifact", inputData.getArtifact());
    context.put("projectVersion", inputData.getVersion());

    List<String> modules = inputData.getModules();
    context.put("dependencies", getDeps(inputData.getModules(), inputData.getPersistence()));

    boolean isCamundaAssert = modules.stream().anyMatch("camunda-assert"::equals);
    context.put("isCamundaAssert", isCamundaAssert);

    return context;
  }

  protected String resolveSpringBootVersion(String starterVersion) {
    return versions.get(starterVersion)
        .getSpringBootVersion();
  }

  protected String resolveCamundaVersion(String starterVersion) {
    return versions.get(starterVersion)
        .getCamundaVersion();
  }

  protected List<Dependency> getDeps(List<String> modules, String persistence) {
    List<Dependency> dependencies = new ArrayList<>();

    modules.forEach(module -> {
      switch (module) {
        case "camunda-base":

          Dependency camundaBase = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter")
              .setVersion(inputData.getStarterVersion());

          dependencies.add(camundaBase);
          break;
        case "camunda-webapps":

          Dependency camundaWebapps = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter-webapp");

          dependencies.add(camundaWebapps);
          break;
        case "camunda-rest":

          Dependency camundaRest = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter-rest");

          dependencies.add(camundaRest);
          break;
        case "camunda-spin":

          Dependency camundaSpin = new Dependency()
              .setGroup("org.camunda.bpm")
              .setArtifact("camunda-engine-plugin-spin");

          dependencies.add(camundaSpin);

          Dependency spinDataformatAll = new Dependency()
              .setGroup("org.camunda.spin")
              .setArtifact("camunda-spin-dataformat-all");

          dependencies.add(spinDataformatAll);
          break;
        case "camunda-assert":

          Dependency camundaTest = new Dependency()
              .setGroup("org.camunda.bpm.springboot")
              .setArtifact("camunda-bpm-spring-boot-starter-test");

          dependencies.add(camundaTest);
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

    dependencies.add(new Dependency()
        .setArtifact("h2")
        .setGroup("com.h2database"));

    if ("on-disk".equals(persistence)) {
      dependencies.add(new Dependency()
          .setArtifact("spring-boot-starter-jdbc")
          .setGroup("org.springframework.boot"));
    } // else: in-memory

    return dependencies;
  }

  protected String dotToSlash(String input) {
    return input.replace(".", "/");
  }

}
