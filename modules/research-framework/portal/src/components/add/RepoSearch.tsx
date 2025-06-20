/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied. See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useEffect, useState} from "react";
import {Box, Button, Field, HStack, Input, Spinner, Text, VStack,} from "@chakra-ui/react";
import {LuSearch} from "react-icons/lu";
import {CreateProjectRequest} from "@/interfaces/Requests/CreateProjectRequest";
import {InputGroup} from "../ui/input-group";
import {CONTROLLER} from "@/lib/controller";
import api from "@/lib/api";
import {ResourceTypeEnum} from "@/interfaces/ResourceTypeEnum";
import {RepositoryResource} from "@/interfaces/ResourceType";
import {ResourceCard} from "../home/ResourceCard";

const RepoSearchInput = ({
                           setCreateResourceRequest,
                           createResourceRequest,
                         }: {
  setCreateResourceRequest: (data: CreateProjectRequest) => void;
  createResourceRequest: CreateProjectRequest;
}) => {
  const [repoSearch, setRepoSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
      null
  );
  const [selectedRepo, setSelectedRepo] = useState<RepositoryResource | null>(
      null
  );

  useEffect(() => {
    setLoading(true);
    if (!repoSearch) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`${CONTROLLER.resources}/public/search`, {
          params: {
            type: ResourceTypeEnum.REPOSITORY,
            name: repoSearch,
          },
        });
        setResults(response.data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 1500);

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [repoSearch]);

  if (selectedRepo) {
    return (
        <>
          <Field.Root>
            <HStack>
              <Field.Label>Repository</Field.Label>
              <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  onClick={() => {
                    setSelectedRepo(null);
                    setCreateResourceRequest({
                      ...createResourceRequest,
                      repositoryId: "",
                    });
                    setRepoSearch("");
                  }}
              >
                Reset Selection
              </Button>
            </HStack>
          </Field.Root>

          <ResourceCard size="sm" resource={selectedRepo} deletable={false} removeOnUnStar={false}/>
        </>
    );
  }

  return (
      <VStack align="start" width="full" gap={2}>
        <Field.Root>
          <Field.Label>Repository</Field.Label>
          <InputGroup startElement={<LuSearch/>} w="full">
            <Input
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="Enter repository name"
            />
          </InputGroup>
        </Field.Root>

        {loading && <Spinner size="sm"/>}

        {!loading && results.length > 0 && (
            <Box mt={2} w="full">
              <VStack align="start" gap={1}>
                {results.map((res) => {
                  return (
                      <Box
                          key={res.id}
                          borderWidth={1}
                          borderRadius="md"
                          p={2}
                          w="full"
                          cursor={"pointer"}
                          _hover={{bg: "gray.100"}}
                          onClick={() => {
                            setSelectedRepo(res);
                            setCreateResourceRequest({
                              ...createResourceRequest,
                              repositoryId: res.id,
                            });
                          }}
                      >
                        <Text key={res.id} fontSize="sm">
                          {res.name}
                        </Text>
                      </Box>
                  );
                })}
              </VStack>
            </Box>
        )}

        {!loading && results.length === 0 && repoSearch !== "" && (
            <Text fontSize="sm" color="gray.500">
              No repositories found
            </Text>
        )}
      </VStack>
  );
};

export default RepoSearchInput;
