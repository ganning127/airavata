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
package org.apache.airavata.sharing.registry.db.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import java.io.Serializable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EntityTypePK implements Serializable {
    private static final Logger logger = LoggerFactory.getLogger(EntityTypePK.class);
    private String entityTypeId;
    private String domainId;

    @Column(name = "ENTITY_TYPE_ID")
    @Id
    public String getEntityTypeId() {
        return entityTypeId;
    }

    public void setEntityTypeId(String entityTypeId) {
        this.entityTypeId = entityTypeId;
    }

    @Column(name = "DOMAIN_ID")
    @Id
    public String getDomainId() {
        return domainId;
    }

    public void setDomainId(String domainId) {
        this.domainId = domainId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        EntityTypePK that = (EntityTypePK) o;

        if (getEntityTypeId() != null
                ? !getEntityTypeId().equals(that.getEntityTypeId())
                : that.getEntityTypeId() != null) return false;
        if (getDomainId() != null ? !getDomainId().equals(that.getDomainId()) : that.getDomainId() != null)
            return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = getEntityTypeId() != null ? getEntityTypeId().hashCode() : 0;
        result = 31 * result + (getDomainId() != null ? getDomainId().hashCode() : 0);
        return result;
    }
}
