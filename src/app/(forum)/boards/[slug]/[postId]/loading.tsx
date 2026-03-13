import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-8 w-3/4 mb-4" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-px w-full mb-6" />
      <div className="space-y-3 mb-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-px w-full mb-6" />
      <Skeleton className="h-24 w-full mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ))}
    </main>
  );
}
