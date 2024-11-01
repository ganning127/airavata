/*****************************************************************
*
*  Licensed to the Apache Software Foundation (ASF) under one  
*  or more contributor license agreements.  See the NOTICE file
*  distributed with this work for additional information       
*  regarding copyright ownership.  The ASF licenses this file  
*  to you under the Apache License, Version 2.0 (the           
*  "License"); you may not use this file except in compliance  
*  with the License.  You may obtain a copy of the License at  
*                                                              
*    http://www.apache.org/licenses/LICENSE-2.0                
*                                                              
*  Unless required by applicable law or agreed to in writing,  
*  software distributed under the License is distributed on an 
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY      
*  KIND, either express or implied.  See the License for the   
*  specific language governing permissions and limitations     
*  under the License.                                          
*                                                              
*
*****************************************************************/
import { Grid, GridItem, Tabs, useToast, Box, Progress, Text, keyframes, TabPanels, Tab, TabPanel, Stack, Heading, IconButton, Icon, Alert, AlertIcon } from "@chakra-ui/react";
import { HeaderBox } from "../components/HeaderBox";
import { DockerContainersList } from "../components/DockerComponents/DockerContainersList";
import { useEffect, useState } from "react";
import { AvailablePrograms } from "../components/DockerComponents/AvaliablePrograms";
import { LuContainer } from "react-icons/lu";
import { AiOutlineCode } from "react-icons/ai";
import { useInterval } from "usehooks-ts";
import { DEBUG_DOCKER_MODE, API_BASE_URL, AUTH_BASE_URL, TOKEN_FILE } from "../lib/constants";
import { motion } from 'framer-motion';
import { useBackendUrls } from "../lib/Contexts";

const PING_DOCKER_INTERVAL = 10000;

const animationKeyframes = keyframes`
  0% { opacity: 1 }
  25% { opacity: 0.5 }
  50% { opacity: 0 }
  75% { opacity: 0.5 }
  100% { opacity: 1 }
`;
const animation = `${animationKeyframes} 2s linear infinite`;

const CustomTab = ({ icon, children }) => {
  return (
    <Tab
      w='100%'
      rounded='md'
      _hover={{
        bg: 'gray.200',
      }}

      _selected={{
        bg: 'blue.500',
        color: 'white',
        fontWeight: 'semibold',
      }}
      gap={2}
      justifyContent='flex-start'
      alignItems={'center'}
    >
      <Icon as={icon} />
      <Text>
        {children}
      </Text>
    </Tab>
  );
};

const DockerHome = () => {
  const [pullLoading, setPullLoading] = useState(null);
  const [dockerUp, setDockerUp] = useState(false);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(1);
  const toast = useToast();
  const { gatewayName } = useBackendUrls();

  useEffect(() => {
    pingDocker();

    window.ipc.send('ensure-token');

    window.ipc.on('docker-pull-progress', (progress) => {
      setPullLoading(progress);
    });

    window.ipc.on('docker-pull-finished', (image) => {
      console.log("Image pulled: ", image);
      setPullLoading(null);
    });

    window.ipc.on('docker-pinged', (data) => {
      if (data) {
        setDockerUp(true);
      } else {
        setDockerUp(false);
      }
    });

    window.ipc.on("notebook-started", (containerId, err) => {
      console.log("notebook started: ", containerId);
      if (err) {
        toast({
          title: "Error",
          description: err,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Success",
          description: "Notebook started successfully. It may take a few seconds for the program to show up.",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      }
    });

    window.ipc.on('ensure-token-result', (isValid) => {
      if (!isValid) {
        setError("You may have been logged out or inactive for too long. Please login again.");
      }
    });

    return () => {
      window.ipc.removeAllListeners("notebook-started");
      window.ipc.removeAllListeners("docker-pinged");
      window.ipc.removeAllListeners('docker-pull-progress');
      window.ipc.removeAllListeners('docker-pull-finished');
      window.ipc.removeAllListeners('ensure-token-result');
    };
  }, []);

  const pingDocker = () => {
    window.ipc.send("docker-ping");
  };

  useInterval(() => {
    pingDocker();
  }, PING_DOCKER_INTERVAL);

  return (
    <Box h='100vh' overflow='hidden' bg='gray.100'>
      <HeaderBox gatewayName={gatewayName} />

      <Tabs h='100%' index={tabIndex} onChange={(index) => setTabIndex(index)} isLazy>
        <Grid templateColumns='repeat(20, 1fr)' h='inherit'>
          <GridItem colSpan={4} bg='gray.100' h='inherit'>
            <Stack direction='column' spacing={2} p={4}>
              <CustomTab icon={AiOutlineCode}>Launch Local Apps</CustomTab>
              <CustomTab icon={LuContainer}>Local App Containers</CustomTab>
            </Stack>

            <Stack direction='row' align='center' p={4}
              position='fixed'
              bottom='0'
            >
              <Box
                w='10px'
                h='10px'
                bg={dockerUp ? 'green.500' : 'red.500'}
                rounded='full'
                as={motion.div}
                animation={animation}
              ></Box>
              <Text>{dockerUp ? "Docker is running" : "Docker is down"}</Text>
            </Stack>

            {
              error && (
                <Alert status='error'>
                  <AlertIcon />
                  {error}
                </Alert>
              )
            }

          </GridItem>
          <GridItem colSpan={16} bg='white' roundedTopLeft='md'>
            <TabPanels>
              <TabPanel>
                <AvailablePrograms
                  isDisabled={pullLoading !== null}
                  loadingText={pullLoading?.progressDetail?.current ? `${pullLoading?.status}` : "Pulling..."}
                  progress={pullLoading?.progressDetail?.current ? pullLoading?.progress : 'Unknown progress...'}
                />
              </TabPanel>

              <TabPanel>
                <DockerContainersList
                  setTabIndex={setTabIndex}
                />
              </TabPanel>
            </TabPanels>
          </GridItem>
        </Grid>
      </Tabs >
    </Box >
  );
};

export default DockerHome;