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
package com.camunda.start.update;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

public class Constants {

  protected static final String URL_MAVEN_C8_BASE =
      "https://repo1.maven.org/maven2/io/camunda/";

  protected static final String URL_MAVEN_C8_METADATA =
      URL_MAVEN_C8_BASE + "camunda-spring-boot-starter/maven-metadata.xml";

  protected static final String URL_MAVEN_C8_METADATA_MD5 =
      URL_MAVEN_C8_METADATA + ".md5";

  protected static final String URL_MAVEN_C8_POM =
      URL_MAVEN_C8_BASE + "camunda-spring-boot-starter/" +
          "{version}/camunda-spring-boot-starter-{version}.pom";

  protected static final String XPATH_VERSIONS = "/metadata/versioning/versions/version";

  protected static final Pattern REGEX_PATTERN_VERSION = Pattern.compile("^([0-9]+).([0-9]+)(.*)");


  protected static final Set<String> IGNORED_VERSION_TAGS = new HashSet<>() {{
    add("alpha");
    add("SNAPSHOT");
    add("-rc");
    add("beta");
  }};

}
