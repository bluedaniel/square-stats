"use client";

interface Props {
  clubs: string[];
  selected: string;
  onChange: (club: string) => void;
}

export function ClubSelector({ clubs, selected, onChange }: Props) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 overflow-x-auto w-fit mx-auto">
      {clubs.map((club) => (
        <button
          key={club}
          onClick={() => onChange(club)}
          className={[
            "px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors select-none",
            club === selected
              ? "bg-background shadow-sm text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {club}
        </button>
      ))}
    </div>
  );
}
