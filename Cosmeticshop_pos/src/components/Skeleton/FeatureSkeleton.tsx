import { Card, Skeleton } from "@heroui/react";

export default function FeatureSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3 rounded-xl">
          <Skeleton className="h-6 w-1/2 rounded-md">
            <div className="h-6 w-1/2 bg-default-200 rounded-md" />
          </Skeleton>
          <Skeleton className="h-4 w-full rounded-md">
            <div className="h-4 w-full bg-default-300 rounded-md" />
          </Skeleton>
          <Skeleton className="h-4 w-2/3 rounded-md">
            <div className="h-4 w-2/3 bg-default-300 rounded-md" />
          </Skeleton>
        </Card>
      ))}
    </div>
  );
}
