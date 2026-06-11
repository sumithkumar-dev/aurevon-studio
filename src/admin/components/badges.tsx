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

export function StatusSelect({
  value,
  onChange,
}: {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none ${statusClasses(value)}`}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
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
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadPriority)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none ${priorityClasses(value)}`}
    >
      {PRIORITY_OPTIONS.map((priority) => (
        <option key={priority} value={priority}>
          {priority}
        </option>
      ))}
    </select>
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
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadSource)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none ${sourceClasses(value)}`}
    >
      {SOURCE_OPTIONS.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
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
