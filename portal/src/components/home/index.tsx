import { Box, Input, HStack, Icon, Container, Button } from "@chakra-ui/react";

import NavBar from "../NavBar";
import { InputGroup } from "../ui/input-group";
import { LuSearch } from "react-icons/lu";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "../PageHeader";
import { AddRepositoryButton } from "./AddRepositoryButton";
import { AddZipButton } from "./AddZipButton";

const Home = () => {
  return (
    <Box>
      <NavBar />

      <Container maxW="container.xl" mt={8}>
        <HStack alignItems="flex-end" justify="space-between">
          <PageHeader
            title="Notebooks"
            description="Community-Published Scientific Notebooks and Repositories."
          />

          <HStack gap={4}>
            <AddZipButton />

            <AddRepositoryButton />
          </HStack>
        </HStack>

        <InputGroup mt={4} endElement={<LuSearch />} w="100%">
          <Input placeholder="Search" rounded="md" />
        </InputGroup>
      </Container>
    </Box>
  );
};

export default Home;
