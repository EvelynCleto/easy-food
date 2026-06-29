import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon size={28} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}