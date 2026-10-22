import { Badge } from "@/components/ui/badge";

const LABELS = { DRAFT: "Draft", OPEN: "Open", CLOSED: "Closed" } as const;
const VARIANTS = { DRAFT: "secondary", OPEN: "default", CLOSED: "outline" } as const;

export function ClassStatusBadge({ status }: { status: keyof typeof LABELS }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
