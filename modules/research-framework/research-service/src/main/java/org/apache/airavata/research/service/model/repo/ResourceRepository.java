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
package org.apache.airavata.research.service.model.repo;

import java.util.List;
import java.util.Optional;
import org.apache.airavata.research.service.enums.StateEnum;
import org.apache.airavata.research.service.model.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, String> {

    @Query(
            """
                    SELECT r
                    FROM #{#entityName} r
                    WHERE TYPE(r) IN :types AND r.name LIKE CONCAT('%', :nameSearch, '%') AND r.state = 'ACTIVE'
                    ORDER BY r.name
                    """)
    Page<Resource> findAllByTypes(
            @Param("types") List<Class<? extends Resource>> types,
            @Param("nameSearch") String nameSearch,
            Pageable pageable);

    @Query(
            """
                    SELECT r
                    FROM Resource r
                    JOIN r.tags t
                    WHERE r.class IN :typeList
                      AND t.value IN :tags
                      AND LOWER(r.name) LIKE LOWER(CONCAT('%', :nameSearch, '%'))
                      AND r.state = 'ACTIVE'
                    GROUP BY r
                    HAVING COUNT(DISTINCT t.value) = :tagCount
                    ORDER BY r.name
                    """)
    Page<Resource> findAllByTypesAndAllTags(
            @Param("typeList") List<Class<? extends Resource>> typeList,
            @Param("tags") String[] tags,
            @Param("tagCount") long tagCount,
            @Param("nameSearch") String nameSearch,
            Pageable pageable);

    @Query(
            """
                    SELECT r
                    FROM Resource r
                    WHERE TYPE(r) = :type AND r.state = 'ACTIVE'
                    AND LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%'))
                    """)
    List<Resource> findByTypeAndNameContainingIgnoreCase(
            @Param("type") Class<? extends Resource> type, @Param("name") String name);

    Optional<Resource> findByIdAndState(String id, StateEnum state);
}
