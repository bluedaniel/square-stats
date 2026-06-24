import type { SessionMeta as Meta } from "@/types/shot";

interface Props {
  meta: Meta;
  filename: string;
  suffix?: React.ReactNode;
  outlierCount?: number;
}

export function SessionMeta({ meta, filename, suffix, outlierCount }: Props) {
  return (
    <p className="text-xs text-muted-foreground">
      {meta.date}
      {meta.place && ` · ${meta.place}`}
      {" · "}
      <span className="italic">{filename}</span>
      {suffix && (
        <>
          {" · "}
          {suffix}
        </>
      )}
      {outlierCount != null && outlierCount > 0 && (
        <>
          {" · "}
          {outlierCount} outlier{outlierCount !== 1 ? "s" : ""}
        </>
      )}
    </p>
  );
}
