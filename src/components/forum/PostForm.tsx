"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { createPostSchema, updatePostSchema, type CreatePostInput, type UpdatePostInput } from "@/lib/validators/board.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagSelector } from "./TagSelector";
import { toast } from "sonner";

interface CreateMode {
  mode: "create";
  boardId: string;
  boardSlug: string;
}

interface EditMode {
  mode: "edit";
  postId: string;
  boardSlug: string;
  initialData: { title: string; content: string; tagNames: string[] };
}

type PostFormProps = CreateMode | EditMode;

export function PostForm(props: PostFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(
    props.mode === "edit" ? props.initialData.tagNames : []
  );

  const schema = props.mode === "create" ? createPostSchema : updatePostSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues:
      props.mode === "edit"
        ? { postId: props.postId, title: props.initialData.title, content: props.initialData.content, tagNames: props.initialData.tagNames }
        : { boardId: props.boardId, title: "", content: "", tagNames: [] },
  });

  const createMutation = trpc.post.create.useMutation({
    onSuccess: (data) => {
      toast.success("게시글이 작성되었습니다.");
      router.push(`/boards/${props.boardSlug}/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.post.update.useMutation({
    onSuccess: (data) => {
      toast.success("게시글이 수정되었습니다.");
      router.push(`/boards/${props.boardSlug}/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const withTags = { ...data, tagNames: tags };
    if (props.mode === "create") {
      createMutation.mutate(withTags as CreatePostInput);
    } else {
      updateMutation.mutate(withTags as UpdatePostInput);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          placeholder="제목을 입력하세요"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          placeholder="내용을 입력하세요"
          className="min-h-[300px] resize-y"
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>태그</Label>
        <TagSelector tags={tags} onChange={setTags} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "저장 중..." : props.mode === "create" ? "작성" : "수정"}
        </Button>
      </div>
    </form>
  );
}
