import { Card, Skeleton } from "@heroui/react";

export default function BannerSkeleton() {
  return (
    <Card className="w-full h-64 rounded-xl overflow-hidden p-4">
      <Skeleton className="h-full w-full rounded-xl">
        <div className="h-full w-full bg-default-300 rounded-xl" />
      </Skeleton>
    </Card>
  );
}
