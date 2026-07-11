import { PageHeader } from "@/components/shell";
import { EmptyState } from "@/components/ui";
export default function Saved() {
  return (
    <div>
      <PageHeader title="Saved searches" description="Save a filter set and (on Scout+) get alerted when new signals match." />
      <EmptyState headline="No saved searches yet" body="Saved searches and new-signal alerts are a Scout+ feature. Build a filter in the feed, then save it here." />
    </div>
  );
}
