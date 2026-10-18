"use client";
import { FileText } from "lucide-react";
export function Empty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ms-empty">
      <FileText />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
