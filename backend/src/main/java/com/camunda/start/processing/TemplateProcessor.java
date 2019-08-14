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

import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.runtime.RuntimeConstants;
import org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader;

import java.io.StringWriter;
import java.util.Map;

public class TemplateProcessor {

  protected Map<String, Object> context;

  public TemplateProcessor(Map<String, Object> context) {
    this.context = context;
  }

  public String process(String templateName) {

    VelocityEngine ve = new VelocityEngine();
    ve.setProperty(RuntimeConstants.RESOURCE_LOADERS, "classpath");
    ve.setProperty("resource.loader.classpath.class", ClasspathResourceLoader.class.getName());
    ve.init();

    Template applicationClass = ve.getTemplate(templateName);

    VelocityContext vc = new VelocityContext();

    context.forEach(vc::put);

    StringWriter writer = new StringWriter();
    applicationClass.merge(vc, writer);

    return writer.toString();
  }

}
