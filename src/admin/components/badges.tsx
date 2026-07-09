import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants";
import type { LeadPriority, LeadSource, LeadStatus } from "../types";
import {
  priorityClasses,
  sourceClasses,
  statusClasses,
} from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shared trigger styling so the closed pill keeps its colored-badge look
 * (unlike a native <select>, Radix renders its own popover for the option
 * list, so it isn't subject to the translucent-background-vs-native-popup
 * contrast bug that affected the old <select> elements here). */
const pillTriggerClass =
  "h-auto w-auto gap-1 rounded-full border px-3 py-1.5 text-xs font-medium shadow-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-0";

export function StatusSelect({
  value,
  onChange,
}: {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeadStatus)}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className={`${pillTriggerClass} ${statusClasses(value)}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PrioritySelect({
  value,
  onChange,
}: {
  value: LeadPriority;
  onChange: (priority: LeadPriority) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeadPriority)}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className={`${pillTriggerClass} ${priorityClasses(value)}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((priority) => (
          <SelectItem key={priority} value={priority}>
            {priority}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SourceSelect({
  value,
  onChange,
}: {
  value: LeadSource;
  onChange: (source: LeadSource) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeadSource)}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className={`${pillTriggerClass} ${sourceClasses(value)}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SOURCE_OPTIONS.map((source) => (
          <SelectItem key={source} value={source}>
            {source}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClasses(priority)}`}
    >
      {priority}
    </span>
  );
}

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${sourceClasses(source)}`}
    >
      {source}
    </span>
  );
}
