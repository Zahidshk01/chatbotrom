type Props = {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
};

export function CategoryChips({ items, selected, onSelect }: Props) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
      {items.map((label) => {
        const active = label === selected;
        return (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-foreground text-background"
                : "bg-surface text-muted-foreground active:bg-surface-2"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
