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
package com.camunda.start.util;

import com.camunda.start.update.dto.StarterVersionWrapperDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public class JsonUtil {

  protected static ObjectMapper objectMapper = new ObjectMapper();

  public static String asJson(StarterVersionWrapperDto starterVersionWrapper) {
    try {
      return objectMapper.writeValueAsString(starterVersionWrapper);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  public static StarterVersionWrapperDto asObject(String versionsAsJson) {
    try {
      return objectMapper.readValue(versionsAsJson, StarterVersionWrapperDto.class);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

}
