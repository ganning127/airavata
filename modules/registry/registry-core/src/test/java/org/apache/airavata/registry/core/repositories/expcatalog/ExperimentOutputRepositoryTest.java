/**
*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements. See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership. The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied. See the License for the
* specific language governing permissions and limitations
* under the License.
*/
package org.apache.airavata.registry.core.repositories.expcatalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.apache.airavata.model.application.io.DataType;
import org.apache.airavata.model.application.io.OutputDataObjectType;
import org.apache.airavata.model.experiment.ExperimentModel;
import org.apache.airavata.model.experiment.ExperimentType;
import org.apache.airavata.model.workspace.Gateway;
import org.apache.airavata.model.workspace.Project;
import org.apache.airavata.registry.core.repositories.common.TestBase;
import org.apache.airavata.registry.cpi.RegistryException;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExperimentOutputRepositoryTest extends TestBase {

    private static final Logger logger = LoggerFactory.getLogger(ExperimentOutputRepositoryTest.class);

    GatewayRepository gatewayRepository;
    ProjectRepository projectRepository;
    ExperimentRepository experimentRepository;
    ExperimentOutputRepository experimentOutputRepository;

    public ExperimentOutputRepositoryTest() {
        super(Database.EXP_CATALOG);
        gatewayRepository = new GatewayRepository();
        projectRepository = new ProjectRepository();
        experimentRepository = new ExperimentRepository();
        experimentOutputRepository = new ExperimentOutputRepository();
    }

    @Test
    public void ExperimentInputRepositoryTest() throws RegistryException {
        Gateway gateway = new Gateway();
        gateway.setGatewayId("gateway");
        gateway.setDomain("SEAGRID");
        gateway.setEmailAddress("abc@d.com");
        String gatewayId = gatewayRepository.addGateway(gateway);

        Project project = new Project();
        project.setName("projectName");
        project.setOwner("user");
        project.setGatewayId(gatewayId);

        String projectId = projectRepository.addProject(project, gatewayId);

        ExperimentModel experimentModel = new ExperimentModel();
        experimentModel.setProjectId(projectId);
        experimentModel.setGatewayId(gatewayId);
        experimentModel.setExperimentType(ExperimentType.SINGLE_APPLICATION);
        experimentModel.setUserName("user");
        experimentModel.setExperimentName("name");

        String experimentId = experimentRepository.addExperiment(experimentModel);
        assertTrue(experimentId != null);

        OutputDataObjectType outputDataObjectTypeExp = new OutputDataObjectType();
        outputDataObjectTypeExp.setName("outputE");
        outputDataObjectTypeExp.setType(DataType.STRING);

        List<OutputDataObjectType> outputDataObjectTypeExpList = new ArrayList<>();
        outputDataObjectTypeExpList.add(outputDataObjectTypeExp);

        assertEquals(
                experimentId,
                experimentOutputRepository.addExperimentOutputs(outputDataObjectTypeExpList, experimentId));
        assertTrue(experimentRepository
                        .getExperiment(experimentId)
                        .getExperimentOutputs()
                        .size()
                == 1);

        outputDataObjectTypeExp.setValue("oValueE");
        experimentOutputRepository.updateExperimentOutputs(outputDataObjectTypeExpList, experimentId);

        List<OutputDataObjectType> retrievedExpOutputList =
                experimentOutputRepository.getExperimentOutputs(experimentId);
        assertTrue(retrievedExpOutputList.size() == 1);
        assertEquals("oValueE", retrievedExpOutputList.get(0).getValue());
        assertEquals(DataType.STRING, retrievedExpOutputList.get(0).getType());

        experimentRepository.removeExperiment(experimentId);
        gatewayRepository.removeGateway(gatewayId);
        projectRepository.removeProject(projectId);
    }
}
