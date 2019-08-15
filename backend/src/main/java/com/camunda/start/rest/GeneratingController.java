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
package com.camunda.start.rest;

import com.camunda.start.processing.ProjectGenerator;
import com.camunda.start.rest.dto.DownloadProjectDto;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class GeneratingController {

  @ExceptionHandler({ BadUserRequestException.class })
  @PostMapping(value = "/download/{myProject}.zip")
  public @ResponseBody byte[] downloadProject(@RequestBody DownloadProjectDto dto) {

    ProjectGenerator projectGenerator = new ProjectGenerator(dto);
    return projectGenerator.generate();
  }

  @ExceptionHandler({ BadUserRequestException.class })
  @PostMapping(value = "/show/{fileName}")
  public @ResponseBody String showFile(@RequestBody DownloadProjectDto dto,
                                       @PathVariable String fileName) {

    ProjectGenerator projectGenerator = new ProjectGenerator(dto);
    return projectGenerator.generate(fileName);
  }

}
