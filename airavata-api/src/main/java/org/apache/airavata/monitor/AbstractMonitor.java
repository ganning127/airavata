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
package org.apache.airavata.monitor;

import java.time.Duration;
import java.util.List;
import org.apache.airavata.common.exception.ApplicationSettingsException;
import org.apache.airavata.common.utils.ServerSettings;
import org.apache.airavata.common.utils.ThriftClientPool;
import org.apache.airavata.model.job.JobModel;
import org.apache.airavata.monitor.kafka.MessageProducer;
import org.apache.airavata.registry.api.RegistryService;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AbstractMonitor {

    private static final Logger log = LoggerFactory.getLogger(AbstractMonitor.class);

    private final MessageProducer messageProducer;
    private ThriftClientPool<RegistryService.Client> registryClientPool;

    public AbstractMonitor() throws ApplicationSettingsException {
        this.initRegistryClientPool();
        messageProducer = new MessageProducer();
    }

    private void initRegistryClientPool() throws ApplicationSettingsException {

        GenericObjectPoolConfig<RegistryService.Client> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(100);
        poolConfig.setMinIdle(5);
        poolConfig.setBlockWhenExhausted(true);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestWhileIdle(true);
        // must set timeBetweenEvictionRunsMillis since eviction doesn't run unless that is positive
        poolConfig.setTimeBetweenEvictionRuns(Duration.ofMinutes(5));
        poolConfig.setNumTestsPerEvictionRun(10);
        poolConfig.setMaxWait(Duration.ofSeconds(3));

        this.registryClientPool = new ThriftClientPool<>(
                RegistryService.Client::new,
                poolConfig,
                ServerSettings.getRegistryServerHost(),
                Integer.parseInt(ServerSettings.getRegistryServerPort()));
    }

    private boolean validateJobStatus(JobStatusResult jobStatusResult) {
        RegistryService.Client registryClient = getRegistryClientPool().getResource();
        boolean validated = true;
        try {
            log.info("Fetching matching jobs for job id {} from registry", jobStatusResult.getJobId());
            List<JobModel> jobs = registryClient.getJobs("jobId", jobStatusResult.getJobId());

            if (!jobs.isEmpty()) {
                log.info("Filtering total {} with target job name {}", jobs.size(), jobStatusResult.getJobName());
                jobs = jobs.stream()
                        .filter(jm -> jm.getJobName().equals(jobStatusResult.getJobName()))
                        .toList();
            }

            if (jobs.size() != 1) {
                log.error(
                        "Couldn't find exactly one job with id {} and name {} in the registry. Count {}",
                        jobStatusResult.getJobId(),
                        jobStatusResult.getJobName(),
                        jobs.size());
                validated = false;

            } else {
                JobModel jobModel = jobs.get(0);

                String processId = jobModel.getProcessId();
                String experimentId = registryClient.getProcess(processId).getExperimentId();

                if (experimentId != null && processId != null) {
                    log.info(
                            "Job id {} is owned by process {} of experiment {}",
                            jobStatusResult.getJobId(),
                            processId,
                            experimentId);
                    validated = true;
                } else {
                    log.error("Experiment or process is null for job {}", jobStatusResult.getJobId());
                    validated = false;
                }
            }
            getRegistryClientPool().returnResource(registryClient);
            return validated;

        } catch (Exception e) {
            log.error("Error at validating job status {}", jobStatusResult.getJobId(), e);
            getRegistryClientPool().returnBrokenResource(registryClient);
            return false;
        }
    }

    public void submitJobStatus(JobStatusResult jobStatusResult) throws MonitoringException {
        try {
            if (validateJobStatus(jobStatusResult)) {
                messageProducer.submitMessageToQueue(jobStatusResult);
            } else {
                throw new MonitoringException("Failed to validate job status for job id " + jobStatusResult.getJobId());
            }
        } catch (Exception e) {
            throw new MonitoringException(
                    "Failed to submit job status for job id " + jobStatusResult.getJobId() + " to status queue", e);
        }
    }

    public ThriftClientPool<RegistryService.Client> getRegistryClientPool() {
        return registryClientPool;
    }
}
