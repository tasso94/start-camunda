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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;

@Component
public class NpmVersionResolver {

  private static final Logger LOG = LoggerFactory.getLogger(NpmVersionResolver.class);
   private static final String NPM_REGISTRY_URL = "https://registry.npmjs.org/@camunda8%2Fsdk/latest";
  private static final String NPM_PROCESS_TEST_REGISTRY_URL = "https://registry.npmjs.org/@camunda8%2Fprocess-test/latest";
  private static final Duration TIMEOUT = Duration.ofSeconds(10);
  private static final String DEFAULT_VERSION = "latest";

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;
  private CachedPackageInfo cachedSdk;
  private CachedPackageInfo cachedProcessTest;

  protected static class CachedPackageInfo {
    protected String version;
    protected String checksum;

    protected CachedPackageInfo(String version, String checksum) {
      this.version = version;
      this.checksum = checksum;
    }
  }

  public NpmVersionResolver() {
    this.httpClient = HttpClient.newHttpClient();
    this.objectMapper = new ObjectMapper();
  }

  public synchronized String getLatestSdkVersion() {
    if (cachedSdk == null) {
      updateVersions();
    }
    return cachedSdk == null ? DEFAULT_VERSION : cachedSdk.version;
  }

  public synchronized String getLatestProcessTestVersion() {
    if (cachedProcessTest == null) {
      updateVersions();
    }
    return cachedProcessTest == null ? DEFAULT_VERSION : cachedProcessTest.version;
  }

  public synchronized boolean updateVersions() {
    boolean changed = false;

    CachedPackageInfo sdkInfo = fetchPackageInfo(NPM_REGISTRY_URL, "sdk");
    if (sdkInfo != null && (cachedSdk == null || !sdkInfo.checksum.equals(cachedSdk.checksum))) {
      cachedSdk = sdkInfo;
      changed = true;
      LOG.info("Updated cached @camunda8/sdk version to {}", sdkInfo.version);
    }

    CachedPackageInfo processTestInfo = fetchPackageInfo(NPM_PROCESS_TEST_REGISTRY_URL, "process-test");
    if (processTestInfo != null && (cachedProcessTest == null || !processTestInfo.checksum.equals(cachedProcessTest.checksum))) {
      cachedProcessTest = processTestInfo;
      changed = true;
      LOG.info("Updated cached @camunda8/process-test version to {}", processTestInfo.version);
    }

    return changed;
  }

  private CachedPackageInfo fetchPackageInfo(String registryUrl, String packageName) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(registryUrl))
          .timeout(TIMEOUT)
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() == 200) {
        JsonNode root = objectMapper.readTree(response.body());
        String latestVersion = root.path("version").asText();

        if (!latestVersion.isEmpty()) {
          String checksum = checksum(response.body());
          return new CachedPackageInfo(latestVersion, checksum);
        }
      }

      LOG.warn("Failed to resolve @camunda8/{} version from npm registry. Status: {}",
          packageName, response.statusCode());
    } catch (Exception e) {
      LOG.warn("Error fetching @camunda8/{} version from npm registry", packageName, e);
    }

    return null;
  }

  private String checksum(String payload) {
    try {
      MessageDigest digest = MessageDigest.getInstance("MD5");
      byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder();
      for (byte b : hash) {
        hex.append(String.format("%02x", b));
      }
      return hex.toString();
    } catch (Exception e) {
      return Integer.toHexString(payload.hashCode());
    }
  }
}

