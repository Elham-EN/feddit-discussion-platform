import { Community, communityState } from "@/atoms/communitiesAtom";
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Image,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { ReactElement, useRef, useState } from "react";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FiCircle } from "react-icons/fi";
import { FaBirthdayCake } from "react-icons/fa";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore, storage } from "@/firebase/clientApp";
import useSelectFile from "@/hooks/useSelectFile";
import { BiFace } from "react-icons/bi";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { FirestoreError, doc, updateDoc } from "firebase/firestore";
import { useSetRecoilState } from "recoil";

interface AboutProps {
  communityData: Community;
}

function About({ communityData }: AboutProps): ReactElement {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const selectedFileRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { selectedFile, onSelectFile } = useSelectFile();
  const setCommunityStateValue = useSetRecoilState(communityState);

  const onUpdateImage = async () => {
    if (!selectedFile) return;
    setUploadingImage(true);
    try {
      // Get image location in storage, upload image and download image url
      const imageRef = ref(storage, `communities/${communityData.id}/image`);
      await uploadString(imageRef, selectedFile, "data_url");
      const downloadURL = await getDownloadURL(imageRef);
      // Update community document in firestore database
      await updateDoc(doc(firestore, "communities", communityData.id), {
        imageURL: downloadURL,
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageURL: downloadURL,
        } as Community,
      }));
    } catch (error) {
      console.log("Upload Image Error:", error);
    }
    setUploadingImage(false);
  };

  return (
    <Box position={"sticky"} top={20}>
      <Flex
        bg={"brand.200"}
        color={"white"}
        align={"center"}
        justify={"space-between"}
        p={5}
        borderRadius={"5px 5px 0px 0px"}
      >
        <Text fontSize={"14pt"} fontWeight={700}>
          About Community
        </Text>
        <Icon
          fontSize={"18pt"}
          as={HiOutlineDotsHorizontal}
          cursor={"pointer"}
        />
      </Flex>
      <Flex
        direction={"column"}
        p={3}
        bg={"white"}
        borderRadius={"0px 0px 5px 5px"}
      >
        <Stack>
          <Flex
            width={"100%"}
            p={2}
            fontSize={"14pt"}
            fontWeight={700}
            gap={10}
          >
            <Flex direction={"column"}>
              <Text>{communityData.numberOfMembers.toLocaleString()}</Text>
              <Text fontWeight={500}>Members</Text>
            </Flex>
            <Flex direction={"column"}>
              <Flex align={"center"} gap={2}>
                <Icon color={"green.300"} fill={"green.300"} as={FiCircle} />
                <Text>2</Text>
              </Flex>
              <Text fontWeight={500}>Online</Text>
            </Flex>
          </Flex>
          <Divider />
          <Flex
            align={"center"}
            width={"100%"}
            p={1}
            fontWeight={500}
            gap={3}
            mb={2}
            mt={2}
          >
            <Icon as={FaBirthdayCake} fontSize={"24px"} />
            {communityData.createdAt && (
              <Text>
                Created{" "}
                {moment(
                  new Date(communityData.createdAt.seconds * 1000)
                ).format("MMM DD, YYYY")}
              </Text>
            )}
          </Flex>
          <Divider />
          {user?.uid && (
            <Link href={`/f/${router.query.communityId}/submit`}>
              <Button mb={2} mt={2} width={"100%"}>
                Create Post
              </Button>
            </Link>
          )}
          {user?.uid === communityData.creatorId && (
            <Stack>
              <Divider />
              <Text p={1} fontWeight={600}>
                Admin
              </Text>
              <Flex align={"center"} justify={"space-between"}>
                <Text
                  color={"blue.500"}
                  cursor={"pointer"}
                  _hover={{ textDecoration: "underline", fontWeight: 600 }}
                  onClick={() => selectedFileRef.current?.click()}
                >
                  Change Image
                </Text>
                {
                  // Check for existent of Community image, if it exist display it
                  // if not, then display the default image. But the community image
                  // can exist in two way, it can be inside communityData: ImageURL
                  // or if user is going to upload a new image
                  communityData.imageURL || selectedFile ? (
                    <Image
                      src={selectedFile || communityData.imageURL}
                      alt="communityImage"
                      borderRadius={"full"}
                      boxSize={"50px"}
                    />
                  ) : (
                    <Icon
                      as={BiFace}
                      fontSize={60}
                      color={"brand.100"}
                      mr={2}
                    />
                  )
                }
              </Flex>

              {
                // If user is attempting to upload image
                selectedFile &&
                  (uploadingImage ? (
                    <Spinner />
                  ) : (
                    <Text
                      cursor={"pointer"}
                      onClick={onUpdateImage}
                      color={"brand.100"}
                      _hover={{
                        color: "brand.200",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      Save Changes
                    </Text>
                  ))
              }
              <input
                id="file-upload"
                type="file"
                accept="image/png,image/gif,image/jpeg"
                hidden
                ref={selectedFileRef}
                onChange={onSelectFile}
              />
            </Stack>
          )}
        </Stack>
      </Flex>
    </Box>
  );
}

export default About;