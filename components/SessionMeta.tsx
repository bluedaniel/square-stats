import { Switch } from "@/components/ui/switch";
import type { SessionMeta as Meta } from "@/types/shot";

interface Props {
  meta: Meta;
  filename: string;
  suffix?: React.ReactNode;
  outlierCount?: number;
  hideOutliers?: boolean;
  onToggleOutliers?: (v: boolean) => void;
}

export function SessionMeta({ meta, filename, suffix, outlierCount, hideOutliers, onToggleOutliers }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        {meta.date}
        {meta.place && ` · ${meta.place}`}
        {" · "}
        <span className="italic">{filename}</span>
        {suffix && <>{" · "}{suffix}</>}
      </p>
      {onToggleOutliers != null && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-muted-foreground">
            Hide outliers{outlierCount != null ? ` (${outlierCount})` : ""}
          </span>
          <Switch checked={!!hideOutliers} onCheckedChange={onToggleOutliers} />
        </label>
      )}
    </div>
  );
}
