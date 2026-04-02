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

import com.camunda.start.rest.BadUserRequestException;
import com.camunda.start.rest.dto.DownloadProjectDto;
import com.camunda.start.update.VersionUpdater;
import com.camunda.start.update.dto.VersionsDto;
import org.apache.maven.artifact.versioning.ComparableVersion;
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

@Component
public class ProjectGenerator {

  protected static final ComparableVersion CAMUNDA_BOM_SWITCH_VERSION = new ComparableVersion("8.9.0");
  protected static final String LANGUAGE_JAVA = "java";
  protected static final String LANGUAGE_NODEJS = "nodejs";

  protected static final String MAIN_PATH = "/src/main/";
  protected static final String JAVA_PATH = MAIN_PATH + "java/";
  protected static final String RESOURCES_PATH = MAIN_PATH + "resources/";

  protected static final String TEST_MAIN_PATH = "/src/test/";
  protected static final String TEST_JAVA_PATH = TEST_MAIN_PATH + "java/";
  protected static final String TEST_RESOURCES_PATH = TEST_MAIN_PATH + "resources/";

  // Java C8 generated file names
  protected static final String APPLICATION_CLASS_NAME = "ProcessOrderApplication.java";
  protected static final String APPLICATION_PROPERTIES_NAME = "application.properties";
  protected static final String APPLICATION_POM_NAME = "pom.xml";
  protected static final String APPLICATION_BPMN_NAME = "process.bpmn";
  protected static final String CHECK_INVENTORY_WORKER_CLASS_NAME = "CheckInventoryWorker.java";
  protected static final String CHARGE_PAYMENT_WORKER_CLASS_NAME = "ChargePaymentWorker.java";
  protected static final String SHIP_ITEMS_WORKER_CLASS_NAME = "ShipItemsWorker.java";
  protected static final String PROCESS_TEST_CLASS_NAME = "ProcessOrderApplicationTests.java";

  // NodeJS generated file names
  protected static final String NODEJS_PACKAGE_JSON_NAME = "package.json";
  protected static final String NODEJS_TSCONFIG_NAME = "tsconfig.json";
  protected static final String NODEJS_INDEX_TS_NAME = "index.ts";
  protected static final String NODEJS_WORKERS_TS_NAME = "workers.ts";
  protected static final String NODEJS_PROCESS_TEST_NAME = "process.test.ts";
  protected static final String NODEJS_JEST_CONFIG_NAME = "jest.config.js";

  // Template keys used by the preview endpoint.
  protected static final String JAVA_MAIN_POM_KEY = "java_main_pom.xml";
  protected static final String JAVA_MAIN_APP_PROPERTIES_KEY = "java_main_application.properties";
  protected static final String JAVA_MAIN_BPMN_KEY = "java_main_process.bpmn";
  protected static final String JAVA_MAIN_APPLICATION_KEY = "java_main_ProcessOrderApplication.java";
  protected static final String JAVA_MAIN_CHECK_INVENTORY_KEY = "java_main_CheckInventoryWorker.java";
  protected static final String JAVA_MAIN_CHARGE_PAYMENT_KEY = "java_main_ChargePaymentWorker.java";
  protected static final String JAVA_MAIN_SHIP_ITEMS_KEY = "java_main_ShipItemsWorker.java";
  protected static final String JAVA_TEST_CLASS_KEY = "java_test_ProcessOrderApplicationTests.java";
  protected static final String JAVA_TEST_APP_PROPERTIES_KEY = "java_test_application.properties";

  protected static final String NODEJS_MAIN_PACKAGE_JSON_KEY = "nodejs_main_package.json";
  protected static final String NODEJS_MAIN_TSCONFIG_KEY = "nodejs_main_tsconfig.json";
  protected static final String NODEJS_MAIN_INDEX_KEY = "nodejs_main_index.ts";
  protected static final String NODEJS_MAIN_WORKERS_KEY = "nodejs_main_workers.ts";
  protected static final String NODEJS_MAIN_BPMN_KEY = "nodejs_main_process.bpmn";
  protected static final String NODEJS_TEST_PROCESS_TEST_KEY = "nodejs_test_process.test.ts";
  protected static final String NODEJS_TEST_JEST_CONFIG_KEY = "nodejs_test_jest.config.js";

  // Scoped template file names
  protected static final String JAVA_MAIN_TEMPLATE_PATH = "java/main/";
  protected static final String JAVA_TEST_TEMPLATE_PATH = "java/test/";
  protected static final String NODEJS_MAIN_TEMPLATE_PATH = "nodejs/main/";
  protected static final String NODEJS_TEST_TEMPLATE_PATH = "nodejs/test/";

  protected static final String TEMPLATES_PATH = "/com/camunda/start/templates/";

  protected DownloadProjectDto inputData;
  protected Map<String, Object> templateContext;
  protected Map<String, VersionsDto> versions;

  @Autowired
  protected VersionUpdater versionUpdater;

  @Autowired
  protected TemplateProcessor templateProcessor;

  public byte[] generate(DownloadProjectDto inputData) {
    initialize(inputData);

    String language = resolveLanguage((String) templateContext.get("language"));

    if (LANGUAGE_NODEJS.equals(language)) {
      return generateNodejs();
    } else {
      return generateJava();
    }
  }

  protected byte[] generateJava() {
    byte[] applicationClass = processTemplate(JAVA_MAIN_TEMPLATE_PATH + APPLICATION_CLASS_NAME);
    byte[] checkInventoryWorkerClass = processTemplate(JAVA_MAIN_TEMPLATE_PATH + CHECK_INVENTORY_WORKER_CLASS_NAME);
    byte[] chargePaymentWorkerClass = processTemplate(JAVA_MAIN_TEMPLATE_PATH + CHARGE_PAYMENT_WORKER_CLASS_NAME);
    byte[] shipItemsWorkerClass = processTemplate(JAVA_MAIN_TEMPLATE_PATH + SHIP_ITEMS_WORKER_CLASS_NAME);
    byte[] applicationProperties = processTemplate(JAVA_MAIN_TEMPLATE_PATH + APPLICATION_PROPERTIES_NAME);
    byte[] pomXml = processTemplate(JAVA_MAIN_TEMPLATE_PATH + APPLICATION_POM_NAME);
    byte[] processBpmn = processTemplate(JAVA_MAIN_TEMPLATE_PATH + APPLICATION_BPMN_NAME);

    String projectName = (String) templateContext.get("artifact");
    String packageName = dotToSlash((String) templateContext.get("group"));

    List<ZipEntrySource> entries = new ArrayList<>(Arrays.asList(
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + APPLICATION_CLASS_NAME, applicationClass),
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + CHECK_INVENTORY_WORKER_CLASS_NAME, checkInventoryWorkerClass),
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + CHARGE_PAYMENT_WORKER_CLASS_NAME, chargePaymentWorkerClass),
        new ByteSource(projectName + JAVA_PATH + packageName + "/" + SHIP_ITEMS_WORKER_CLASS_NAME, shipItemsWorkerClass),
        new ByteSource(projectName + RESOURCES_PATH + APPLICATION_PROPERTIES_NAME, applicationProperties),
        new ByteSource(projectName + "/" + APPLICATION_POM_NAME, pomXml),
        new ByteSource(projectName + RESOURCES_PATH + APPLICATION_BPMN_NAME, processBpmn)
    ));

    boolean isProcessTest = (boolean) templateContext.get("isProcessTest");
    if (isProcessTest) {
      byte[] processTest = processTemplate(JAVA_TEST_TEMPLATE_PATH + PROCESS_TEST_CLASS_NAME);
      byte[] processTestApplicationProperties = processTemplate(JAVA_TEST_TEMPLATE_PATH + APPLICATION_PROPERTIES_NAME);
      entries.add(new ByteSource(projectName + TEST_JAVA_PATH + packageName + "/" + PROCESS_TEST_CLASS_NAME, processTest));
      entries.add(new ByteSource(projectName + TEST_RESOURCES_PATH + APPLICATION_PROPERTIES_NAME, processTestApplicationProperties));
    }

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ZipUtil.pack(entries.toArray(new ZipEntrySource[0]), baos);
    return baos.toByteArray();
  }

  protected byte[] generateNodejs() {
    byte[] packageJson = processTemplate(NODEJS_MAIN_TEMPLATE_PATH + NODEJS_PACKAGE_JSON_NAME);
    byte[] tsconfig = processTemplate(NODEJS_MAIN_TEMPLATE_PATH + NODEJS_TSCONFIG_NAME);
    byte[] indexTs = processTemplate(NODEJS_MAIN_TEMPLATE_PATH + NODEJS_INDEX_TS_NAME);
    byte[] workersTs = processTemplate(NODEJS_MAIN_TEMPLATE_PATH + NODEJS_WORKERS_TS_NAME);
    byte[] processBpmn = processTemplate(NODEJS_MAIN_TEMPLATE_PATH + APPLICATION_BPMN_NAME);

    String projectName = (String) templateContext.get("artifact");

    List<ZipEntrySource> entries = new ArrayList<>(Arrays.asList(
        new ByteSource(projectName + "/" + NODEJS_PACKAGE_JSON_NAME, packageJson),
        new ByteSource(projectName + "/" + NODEJS_TSCONFIG_NAME, tsconfig),
        new ByteSource(projectName + "/source/" + NODEJS_INDEX_TS_NAME, indexTs),
        new ByteSource(projectName + "/source/" + NODEJS_WORKERS_TS_NAME, workersTs),
        new ByteSource(projectName + "/source/resources/" + APPLICATION_BPMN_NAME, processBpmn)
    ));

    boolean isProcessTest = (boolean) templateContext.get("isProcessTest");
    if (isProcessTest) {
      byte[] processTest = processTemplate(NODEJS_TEST_TEMPLATE_PATH + NODEJS_PROCESS_TEST_NAME);
      byte[] jestConfig = processTemplate(NODEJS_TEST_TEMPLATE_PATH + NODEJS_JEST_CONFIG_NAME);
      entries.add(new ByteSource(projectName + "/source/test/" + NODEJS_PROCESS_TEST_NAME, processTest));
      entries.add(new ByteSource(projectName + "/source/test/" + NODEJS_JEST_CONFIG_NAME, jestConfig));
    }

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ZipUtil.pack(entries.toArray(new ZipEntrySource[0]), baos);
    return baos.toByteArray();
  }

  public String generate(DownloadProjectDto inputData, String fileKey) {
    initialize(inputData);
    resolveLanguage((String) templateContext.get("language"));

    String templatePath = resolveTemplatePath(fileKey);
    return templateProcessor.process(templateContext, TEMPLATES_PATH + templatePath + ".vm");
  }

  protected byte[] processTemplate(String templatePath) {
    return templateProcessor.process(templateContext, TEMPLATES_PATH + templatePath + ".vm")
        .getBytes();
  }

  protected String resolveTemplatePath(String fileKey) {
    Map<String, String> templatePaths = new HashMap<>();

    templatePaths.put(JAVA_MAIN_POM_KEY, JAVA_MAIN_TEMPLATE_PATH + APPLICATION_POM_NAME);
    templatePaths.put(JAVA_MAIN_APP_PROPERTIES_KEY, JAVA_MAIN_TEMPLATE_PATH + APPLICATION_PROPERTIES_NAME);
    templatePaths.put(JAVA_MAIN_BPMN_KEY, JAVA_MAIN_TEMPLATE_PATH + APPLICATION_BPMN_NAME);
    templatePaths.put(JAVA_MAIN_APPLICATION_KEY, JAVA_MAIN_TEMPLATE_PATH + APPLICATION_CLASS_NAME);
    templatePaths.put(JAVA_MAIN_CHECK_INVENTORY_KEY, JAVA_MAIN_TEMPLATE_PATH + CHECK_INVENTORY_WORKER_CLASS_NAME);
    templatePaths.put(JAVA_MAIN_CHARGE_PAYMENT_KEY, JAVA_MAIN_TEMPLATE_PATH + CHARGE_PAYMENT_WORKER_CLASS_NAME);
    templatePaths.put(JAVA_MAIN_SHIP_ITEMS_KEY, JAVA_MAIN_TEMPLATE_PATH + SHIP_ITEMS_WORKER_CLASS_NAME);

    boolean isProcessTest = (boolean) templateContext.get("isProcessTest");
    if (isProcessTest) {
      templatePaths.put(JAVA_TEST_CLASS_KEY, JAVA_TEST_TEMPLATE_PATH + PROCESS_TEST_CLASS_NAME);
      templatePaths.put(JAVA_TEST_APP_PROPERTIES_KEY, JAVA_TEST_TEMPLATE_PATH + APPLICATION_PROPERTIES_NAME);
      templatePaths.put(NODEJS_TEST_PROCESS_TEST_KEY, NODEJS_TEST_TEMPLATE_PATH + NODEJS_PROCESS_TEST_NAME);
      templatePaths.put(NODEJS_TEST_JEST_CONFIG_KEY, NODEJS_TEST_TEMPLATE_PATH + NODEJS_JEST_CONFIG_NAME);
    }

    templatePaths.put(NODEJS_MAIN_PACKAGE_JSON_KEY, NODEJS_MAIN_TEMPLATE_PATH + NODEJS_PACKAGE_JSON_NAME);
    templatePaths.put(NODEJS_MAIN_TSCONFIG_KEY, NODEJS_MAIN_TEMPLATE_PATH + NODEJS_TSCONFIG_NAME);
    templatePaths.put(NODEJS_MAIN_INDEX_KEY, NODEJS_MAIN_TEMPLATE_PATH + NODEJS_INDEX_TS_NAME);
    templatePaths.put(NODEJS_MAIN_WORKERS_KEY, NODEJS_MAIN_TEMPLATE_PATH + NODEJS_WORKERS_TS_NAME);
    templatePaths.put(NODEJS_MAIN_BPMN_KEY, NODEJS_MAIN_TEMPLATE_PATH + APPLICATION_BPMN_NAME);

    String templatePath = templatePaths.get(fileKey);
    if (templatePath == null) {
      throw new BadUserRequestException(new IllegalArgumentException("Unknown template key: " + fileKey));
    }
    return templatePath;
  }

  public void initialize(DownloadProjectDto inputData) {
    this.inputData = inputData;

    VersionsDto resolvedVersion = versionUpdater.getVersionsWrapper().getVersions();
    if (resolvedVersion == null) {
      throw new BadUserRequestException(new IllegalStateException("No starter version available"));
    }
    versions = new LinkedHashMap<>();
    versions.put(resolvedVersion.getCamundaVersion(), resolvedVersion);

    addDefaultValues(inputData);

    templateContext = initTemplateContext(inputData);
  }

  protected void addDefaultValues(DownloadProjectDto inputData) {
    if (isEmpty(inputData.getModules())) {
      inputData.setModules(Collections.emptyList());
    }
    if (isEmpty(inputData.getGroup())) {
      inputData.setGroup("com.example.workflow");
    }
    if (isEmpty(inputData.getArtifact())) {
      inputData.setArtifact("my-project");
    }
    if (isEmpty(inputData.getCamundaVersion())) {
      String latestCamundaVersion = versions.keySet()
          .iterator()
          .next();
      inputData.setCamundaVersion(latestCamundaVersion);
    }
    if (isEmpty(inputData.getJavaVersion())) {
      inputData.setJavaVersion("21");
    }
    if (isEmpty(inputData.getVersion())) {
      inputData.setVersion("1.0.0-SNAPSHOT");
    }
    if (isEmpty(inputData.getLanguage())) {
      inputData.setLanguage("java");
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

    String camundaVersion = inputData.getCamundaVersion();
    VersionsDto selectedVersion = versions.get(camundaVersion);
    if (selectedVersion == null) {
      throw new BadUserRequestException(new IllegalArgumentException("Unknown camundaVersion: " + camundaVersion));
    }

    String selectedCamundaVersion = selectedVersion.getCamundaVersion();
    context.put("camundaVersion", selectedCamundaVersion);
    context.put("camundaBomArtifactId", resolveCamundaBomArtifactId(selectedCamundaVersion));
    context.put("springBootVersion", selectedVersion.getSpringBootVersion());
    context.put("javaVersion", inputData.getJavaVersion());

    context.put("group", inputData.getGroup());
    context.put("artifact", inputData.getArtifact());
    context.put("projectVersion", inputData.getVersion());
    context.put("language", resolveLanguage(inputData.getLanguage()));

    List<String> modules = inputData.getModules();
    boolean isProcessTest = modules.stream().anyMatch("process-test"::equals);
    context.put("isProcessTest", isProcessTest);

    context.put("npmSdkVersion", resolveNpmVersionOrLatest(selectedVersion.getNpmSdkVersion()));
    context.put("npmProcessTestVersion", resolveNpmVersionOrLatest(selectedVersion.getNpmProcessTestVersion()));

    return context;
  }

  protected String resolveCamundaBomArtifactId(String camundaVersion) {
    ComparableVersion selectedVersion = new ComparableVersion(camundaVersion);
    return selectedVersion.compareTo(CAMUNDA_BOM_SWITCH_VERSION) >= 0 ? "camunda-bom" : "zeebe-bom";
  }

  protected String resolveNpmVersionOrLatest(String version) {
    return version == null || version.isEmpty() ? "latest" : version;
  }

  protected String resolveLanguage(String language) {
    if (LANGUAGE_JAVA.equals(language) || LANGUAGE_NODEJS.equals(language)) {
      return language;
    }
    throw new BadUserRequestException(new IllegalArgumentException("Unsupported language: " + language));
  }


  protected String dotToSlash(String input) {
    return input.replace(".", "/");
  }

}
