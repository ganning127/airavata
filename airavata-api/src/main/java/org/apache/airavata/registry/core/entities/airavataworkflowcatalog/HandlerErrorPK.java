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
package org.apache.airavata.registry.core.entities.airavataworkflowcatalog;

import java.io.Serializable;
import java.util.Objects;

public class HandlerErrorPK implements Serializable {
    private static final long serialVersionUID = 1L;

    private String errorId;
    private String handlerId;

    public HandlerErrorPK() {}

    public void setErrorId(String errorId) {
        this.errorId = errorId;
    }

    public void setHandlerId(String handlerId) {
        this.handlerId = handlerId;
    }

    public String getErrorId() {
        return errorId;
    }

    public String getHandlerId() {
        return handlerId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HandlerErrorPK that = (HandlerErrorPK) o;
        return Objects.equals(errorId, that.errorId) && Objects.equals(handlerId, that.handlerId);
    }

    @Override
    public int hashCode() {

        return Objects.hash(errorId, handlerId);
    }
}
