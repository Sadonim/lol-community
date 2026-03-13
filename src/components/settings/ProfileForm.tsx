"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  username: z.string().min(2, "2자 이상").max(20, "20자 이하"),
  avatarUrl: z.string().url("올바른 URL을 입력해주세요").or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: { username: string; avatarUrl: string | null };
}

export function ProfileForm({ defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: defaultValues.username,
      avatarUrl: defaultValues.avatarUrl ?? "",
    },
  });

  const update = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("프로필이 저장되었습니다.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: FormData) => {
    update.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">프로필 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">닉네임</Label>
            <Input id="username" {...register("username")} />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl">아바타 URL (선택)</Label>
            <Input id="avatarUrl" placeholder="https://..." {...register("avatarUrl")} />
            {errors.avatarUrl && (
              <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
            )}
          </div>

          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
