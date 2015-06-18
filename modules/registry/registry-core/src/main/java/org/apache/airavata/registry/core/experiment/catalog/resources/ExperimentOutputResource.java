/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

package org.apache.airavata.registry.core.experiment.catalog.resources;

import org.apache.airavata.registry.core.experiment.catalog.ExpCatResourceUtils;
import org.apache.airavata.registry.core.experiment.catalog.ExperimentCatResource;
import org.apache.airavata.registry.core.experiment.catalog.ResourceType;
import org.apache.airavata.registry.core.experiment.catalog.model.ExperimentOutput;
import org.apache.airavata.registry.cpi.RegistryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import java.util.List;

public class ExperimentOutputResource extends AbstractExpCatResource {
    private static final Logger logger = LoggerFactory.getLogger(ExperimentOutputResource.class);
    private int experimentOutputId;
    private String experimentId;
    private String dataType;
    private String applicationArgument;
    private Boolean isRequired;
    private Boolean requiredToAddedToCmd;
    private Boolean dataMovement;
    private String location;
    private String searchQuery;

    public int getExperimentOutputId() {
        return experimentOutputId;
    }

    public void setExperimentOutputId(int experimentOutputId) {
        this.experimentOutputId = experimentOutputId;
    }

    public String getExperimentId() {
        return experimentId;
    }

    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getApplicationArgument() {
        return applicationArgument;
    }

    public void setApplicationArgument(String applicationArgument) {
        this.applicationArgument = applicationArgument;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
    }

    public Boolean getRequiredToAddedToCmd() {
        return requiredToAddedToCmd;
    }

    public void setRequiredToAddedToCmd(Boolean requiredToAddedToCmd) {
        this.requiredToAddedToCmd = requiredToAddedToCmd;
    }

    public Boolean getDataMovement() {
        return dataMovement;
    }

    public void setDataMovement(Boolean dataMovement) {
        this.dataMovement = dataMovement;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
    }

    public ExperimentCatResource create(ResourceType type) throws RegistryException {
        logger.error("Unsupported resource type for process output data resource.", new UnsupportedOperationException());
        throw new UnsupportedOperationException();
    }

    
    public void remove(ResourceType type, Object name) throws RegistryException {
        logger.error("Unsupported resource type for process output data resource.", new UnsupportedOperationException());
        throw new UnsupportedOperationException();
    }

    
    public ExperimentCatResource get(ResourceType type, Object name) throws RegistryException{
        logger.error("Unsupported resource type for process output data resource.", new UnsupportedOperationException());
        throw new UnsupportedOperationException();
    }

    
    public List<ExperimentCatResource> get(ResourceType type) throws RegistryException{
        logger.error("Unsupported resource type for process output data resource.", new UnsupportedOperationException());
        throw new UnsupportedOperationException();
    }

    
    public void save() throws RegistryException{
        EntityManager em = null;
        try {
            em = ExpCatResourceUtils.getEntityManager();
            em.getTransaction().begin();
            if(experimentId == null){
                throw new RegistryException("Does not have the experiment id");
            }
            ExperimentOutput experimentOutput;
            experimentOutput = em.find(ExperimentOutput.class, experimentOutputId);
            if(experimentOutput == null){
                experimentOutput = new ExperimentOutput();
            }
            experimentOutput.setExperimentOutputId(experimentOutputId);
            experimentOutput.setExperimentId(experimentId);
            experimentOutput.setDataType(dataType);
            experimentOutput.setApplicationArgument(applicationArgument);
            experimentOutput.setIsRequired(isRequired);
            experimentOutput.setRequiredToAddedToCmd(requiredToAddedToCmd);
            experimentOutput.setDataMovement(dataMovement);
            experimentOutput.setLocation(location);
            experimentOutput.setSearchQuery(searchQuery);
            em.persist(experimentOutput);
            em.getTransaction().commit();
            em.close();
            this.experimentOutputId = experimentOutput.getExperimentOutputId();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            throw new RegistryException(e);
        } finally {
            if (em != null && em.isOpen()) {
                if (em.getTransaction().isActive()){
                    em.getTransaction().rollback();
                }
                em.close();
            }
        }
    }
}