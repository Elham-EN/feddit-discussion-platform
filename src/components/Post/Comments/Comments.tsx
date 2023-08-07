import { Post, postState } from "@/atoms/postsAtom";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { User } from "firebase/auth";
import React, { ReactElement, useEffect, useState } from "react";
import CommentInput from "./CommentInput";
import {
  FirestoreError,
  Timestamp,
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase/clientApp";
import { useSetRecoilState } from "recoil";
import CommentItem, { Comment } from "./CommentItem";
import { log } from "console";

interface CommentsProps {
  user: User;
  selectedPost: Post | null;
  communityId: string;
}

function Comments({
  user,
  selectedPost,
  communityId,
}: CommentsProps): ReactElement {
  const [commentText, setCommentText] = useState<string>("");
  // represent all of the comments for this post coming from DB
  const [comments, setComments] = useState<Comment[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);
  const setPostState = useSetRecoilState(postState);

  const onCreateComment = async () => {
    setCreateLoading(true);
    try {
      // Create Batch Instance
      const batch = writeBatch(firestore);
      // Create a comment document
      const commentDocRef = doc(collection(firestore, "comments"));
      const newComment: Comment = {
        id: commentDocRef.id,
        creatorId: user.uid,
        creatorDisplayText: user.email!.split("@")[0],
        communityId,
        postId: selectedPost?.id!,
        postTitle: selectedPost?.title!,
        text: commentText,
        createdAt: serverTimestamp() as Timestamp,
      };
      batch.set(commentDocRef, newComment);
      // Update post numberOfComments +1
      const postDocRef = doc(firestore, "posts", selectedPost?.id!);
      batch.update(postDocRef, {
        numberOfComments: increment(1),
      });
      await batch.commit();
      newComment.createdAt = { seconds: Date.now() / 1000 } as Timestamp;
      // Update UI client recoil global state
      setCommentText("");
      setComments((prev) => [newComment, ...prev]);
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost,
          numberOfComments: prev.selectedPost?.numberOfComments! + 1,
        } as Post,
      }));
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.log(firestoreError.message);
    }
    setCreateLoading(false);
  };

  const onDeleteComment = async (comment: any) => {};

  const getPostComments = async () => {};

  useEffect(() => {
    console.log(comments);

    getPostComments();
  }, [comments]);

  return (
    <Box bg={"white"} borderRadius={"0px 0px 5px 5px"} p={3}>
      <Flex
        direction={"column"}
        pl={10}
        pr={4}
        mb={6}
        fontSize={"14pt"}
        width={"100%"}
      >
        <CommentInput
          commentText={commentText}
          setCommentText={setCommentText}
          user={user}
          createLoading={createLoading}
          onCreateComment={onCreateComment}
        />
      </Flex>
      <Stack spacing={6}>
        {comments.map((comment: Comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDeleteComment={onDeleteComment}
            loadingDelete={false}
            userId={user?.uid}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default Comments;