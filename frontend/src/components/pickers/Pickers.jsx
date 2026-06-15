import { useState } from "react";
import { Check, Calendar, UserCircle2, Users, Tag, GitBranch, X, Box } from "lucide-react";
import Popover from "../ui/Popover.jsx";
import PillButton from "../ui/PillButton.jsx";
import Avatar from "../ui/Avatar.jsx";

function MenuItem({ children, onClick, selected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg transition-colors hover:bg-surface-hover"
    >
      <span className="flex flex-1 items-center gap-2">{children}</span>
      {selected && <Check className="h-3.5 w-3.5 text-brand" />}
    </button>
  );
}

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

/* ----- generic status / priority (enum maps) ----- */
export function EnumPicker({ value, onChange, map, order, fallback }) {
  const meta = map[value] || map[fallback];
  const Icon = meta.icon;
  return (
    <Popover
      trigger={({ toggle }) => (
        <PillButton icon={Icon} iconColor={meta.color} onClick={toggle} active>
          {meta.label}
        </PillButton>
      )}
    >
      {({ close }) =>
        order.map((key) => {
          const m = map[key];
          const I = m.icon;
          return (
            <MenuItem
              key={key}
              selected={key === value}
              onClick={() => {
                onChange(key);
                close();
              }}
            >
              <I className="h-3.5 w-3.5" style={{ color: m.color }} />
              {m.label}
            </MenuItem>
          );
        })
      }
    </Popover>
  );
}

/* ----- single user (lead / assignee) ----- */
export function UserPicker({ value, onChange, users, label = "Lead", icon: Icon = UserCircle2 }) {
  const selected = users.find((u) => u.id === value);
  return (
    <Popover
      trigger={({ toggle }) => (
        <PillButton icon={selected ? undefined : Icon} onClick={toggle} active={!!selected}>
          {selected ? (
            <>
              <Avatar name={selected.name} src={selected.avatarUrl} size="sm" />
              {selected.name}
            </>
          ) : (
            label
          )}
        </PillButton>
      )}
    >
      {({ close }) => (
        <div className="max-h-64 overflow-y-auto">
          <MenuItem
            selected={!value}
            onClick={() => {
              onChange(null);
              close();
            }}
          >
            <Icon className="h-4 w-4 text-fg-subtle" />
            No {label.toLowerCase()}
          </MenuItem>
          {users.map((u) => (
            <MenuItem
              key={u.id}
              selected={u.id === value}
              onClick={() => {
                onChange(u.id);
                close();
              }}
            >
              <Avatar name={u.name} src={u.avatarUrl} size="sm" />
              {u.name}
            </MenuItem>
          ))}
        </div>
      )}
    </Popover>
  );
}

/* ----- multi user (members) ----- */
export function MembersPicker({ value = [], onChange, users }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const selected = users.filter((u) => value.includes(u.id));
  return (
    <Popover
      trigger={({ toggle: t }) => (
        <PillButton icon={selected.length ? undefined : Users} onClick={t} active={selected.length > 0}>
          {selected.length ? (
            <span className="flex -space-x-1.5">
              {selected.slice(0, 3).map((u) => (
                <Avatar key={u.id} name={u.name} src={u.avatarUrl} size="sm" className="ring-1 ring-bg" />
              ))}
              {selected.length > 3 && <span className="ml-2">+{selected.length - 3}</span>}
            </span>
          ) : (
            "Members"
          )}
        </PillButton>
      )}
    >
      <div className="max-h-64 overflow-y-auto">
        {users.map((u) => (
          <MenuItem key={u.id} selected={value.includes(u.id)} onClick={() => toggle(u.id)}>
            <Avatar name={u.name} src={u.avatarUrl} size="sm" />
            {u.name}
          </MenuItem>
        ))}
        {users.length === 0 && <p className="px-2 py-2 text-xs text-fg-subtle">No members yet</p>}
      </div>
    </Popover>
  );
}

/* ----- date pill ----- */
export function DatePicker({ value, onChange, label }) {
  return (
    <Popover
      trigger={({ toggle }) => (
        <PillButton icon={Calendar} onClick={toggle} active={!!value}>
          {value ? fmtDate(value) : label}
        </PillButton>
      )}
    >
      {({ close }) => (
        <div className="flex flex-col gap-2 p-1">
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="rounded-md border border-input-border bg-input px-2 py-1.5 text-sm text-fg focus:outline-none"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                close();
              }}
              className="text-left text-xs text-fg-muted hover:text-fg"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}

/* ----- labels (multi + create) ----- */
export function LabelPicker({ value = [], onChange, labels, onCreateLabel }) {
  const [name, setName] = useState("");
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const selected = labels.filter((l) => value.includes(l.id));

  const create = async () => {
    if (!name.trim() || !onCreateLabel) return;
    const label = await onCreateLabel(name.trim());
    setName("");
    if (label && !value.includes(label.id)) onChange([...value, label.id]);
  };

  return (
    <Popover
      trigger={({ toggle: t }) => (
        <PillButton icon={Tag} onClick={t} active={selected.length > 0}>
          {selected.length ? `${selected.length} label${selected.length > 1 ? "s" : ""}` : "Labels"}
        </PillButton>
      )}
    >
      <div className="w-56">
        <div className="max-h-48 overflow-y-auto">
          {labels.map((l) => (
            <MenuItem key={l.id} selected={value.includes(l.id)} onClick={() => toggle(l.id)}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.name}
            </MenuItem>
          ))}
          {labels.length === 0 && (
            <p className="px-2 py-2 text-xs text-fg-subtle">No labels yet</p>
          )}
        </div>
        {onCreateLabel && (
          <div className="mt-1 flex gap-1 border-t border-glass-border p-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), create())}
              placeholder="New label…"
              className="h-7 flex-1 rounded border border-input-border bg-input px-2 text-xs text-fg focus:outline-none"
            />
            <button
              type="button"
              onClick={create}
              className="rounded bg-brand px-2 text-xs font-medium text-brand-fg"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </Popover>
  );
}

/* ----- dependencies (multi projects) ----- */
export function DependencyPicker({ value = [], onChange, projects }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <Popover
      trigger={({ toggle: t }) => (
        <PillButton icon={GitBranch} onClick={t} active={value.length > 0}>
          {value.length ? `${value.length} dependenc${value.length > 1 ? "ies" : "y"}` : "Dependencies"}
        </PillButton>
      )}
    >
      <div className="max-h-64 w-56 overflow-y-auto">
        {projects.map((p) => (
          <MenuItem key={p.id} selected={value.includes(p.id)} onClick={() => toggle(p.id)}>
            {p.icon ? (
              <span aria-hidden="true">{p.icon}</span>
            ) : (
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="truncate">{p.name}</span>
          </MenuItem>
        ))}
        {projects.length === 0 && (
          <p className="px-2 py-2 text-xs text-fg-subtle">No other projects</p>
        )}
      </div>
    </Popover>
  );
}

export { X };
