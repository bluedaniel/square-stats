import { type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { CSVDropzone } from "@/components/CSVDropzone";
import { useLoadSession } from "@/hooks/useLoadSession";
import { PAGE_SKELETONS, type SkeletonPage } from "@/components/PageSkeleton";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function NoSessionState({ page }: { page: SkeletonPage }) {
  const { loadFile } = useLoadSession();
  const SkeletonComponent = PAGE_SKELETONS[page];
  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="pointer-events-none select-none opacity-30 blur-[1px]" aria-hidden>
        <SkeletonComponent />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <CSVDropzone
          onFile={(text, name) => {
            try {
              loadFile(text, name);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not read file", {
                description: name,
              });
            }
          }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 px-6 text-center max-w-sm mx-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
