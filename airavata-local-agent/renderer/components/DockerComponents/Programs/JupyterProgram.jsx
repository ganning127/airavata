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
import {
  Button, Box, Text, useDisclosure, useToast, Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  Stack, FormHelperText,
  Heading, Flex,
  Img
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

const DEFAULT_CONFIG = {
  port: "6080",
  name: "",
  mountLocation: ""
};

export const JupyterProgram = () => {
  const CreateJupyterModal = useDisclosure();
  const [startContainerConfig, setStartContainerConfig] = useState(DEFAULT_CONFIG);
  const toast = useToast();

  useEffect(() => {
    window.ipc.send('get-csagent-path');

    window.ipc.on("filepath-chosen", (filepath) => {
      setStartContainerConfig(prev => ({
        ...prev,
        mountLocation: filepath
      }));

      console.log("Filepath chosen: ", filepath);
    });

    window.ipc.on('got-csagent-path', (path) => {
      setStartContainerConfig(prev => ({
        ...prev,
        mountLocation: path
      }));
    });

    return () => {
      window.ipc.removeAllListeners("filepath-chosen");
      window.ipc.removeAllListeners("got-csagent-path");
    };
  }, []);


  const handleStartNotebook = () => {
    if (startContainerConfig.port === "") {
      toast({
        title: "Error",
        description: "Please enter a port number",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    // mount on host machine
    let createOptions = {
      'name': startContainerConfig.name.trim().replaceAll(" ", "-"),
      'Tty': false,
      'Labels': {
        'cybershuttle-local-agent': 'true'
      },
      'ExposedPorts': {
        '8888/tcp': {}
      },
      'HostConfig': {
        'PortBindings': {
          '8888/tcp': [
            {
              'HostPort': startContainerConfig.port
            }
          ]
        },
      },
    };

    createOptions.HostConfig.Binds = [`${startContainerConfig.mountLocation}:/root/csagent`];
    createOptions.Volumes = {
      'root/csagent': {}
    };

    window.ipc.send("start-notebook", createOptions);
    setStartContainerConfig(DEFAULT_CONFIG);
    CreateJupyterModal.onClose();
  };

  return (
    <>
      <Modal isOpen={CreateJupyterModal.isOpen} onClose={CreateJupyterModal.onClose} size='4xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a Jupyter Notebook</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Container Name</FormLabel>
              <Input value={startContainerConfig.name} onChange={(e) => {
                setStartContainerConfig(prev => ({
                  ...prev,
                  name: e.target.value
                }));
              }}
              />
              <FormHelperText>Container name cannot have spaces. If blank, one will automatically be generated for you.</FormHelperText>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Port on Host Computer</FormLabel>
              <Input value={startContainerConfig.port} onChange={(e) => {
                setStartContainerConfig(prev => ({
                  ...prev,
                  port: e.target.value
                }));
              }}
              />
              <FormHelperText>Usually, ports 6000 and up can be used. Two containers cannot run on the same port on the host machine.</FormHelperText>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Mount Location</FormLabel>
              <Stack direction='row'>
                <Input value={startContainerConfig.mountLocation} readOnly isDisabled />
              </Stack>
              <FormHelperText>Please do not edit this value, it will allow you to access remote servers.</FormHelperText>
            </FormControl>

            <Button
              mt={4}
              onClick={() => {
                handleStartNotebook();
              }}
              colorScheme='green'
              isDisabled={startContainerConfig.port === ""}
            >
              Start Jupyter Notebook
            </Button>
          </ModalBody>

          <ModalFooter />
        </ModalContent>
      </Modal>

      <Box shadow='md' rounded='md' p={4}
        onClick={() => {
          CreateJupyterModal.onOpen();
        }}
        _hover={{
          cursor: "pointer",
          background: "gray.100"
        }}
      >
        <Stack spacing={2}>
          <Flex align='center' gap={2}>
            <Img src="/images/jupyter_logo.png" alt="Jupyter Logo" boxSize='30px' />
            <Heading size='md'>Airavata Jupyter Lab</Heading>

          </Flex>
          <Text>Allows for both remote and local execution.</Text>
        </Stack>
      </Box>
    </>
  );
};