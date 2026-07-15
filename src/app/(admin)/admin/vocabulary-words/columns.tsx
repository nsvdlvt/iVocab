"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export type VocabWordRow = {
  id: string;
  word: string;
  meaning: string;
  vocab_sets: { title: string } | null;
  created_at: string;
};

export const columns: ColumnDef<VocabWordRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "word",
    header: "Word",
    cell: ({ row }) => <div className="font-bold">{row.getValue("word")}</div>,
  },
  {
    accessorKey: "meaning",
    header: "Meaning",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("meaning")}</div>,
  },
  {
    accessorKey: "vocab_sets.title",
    header: "Set",
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.vocab_sets?.title || "-"}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Added",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div className="text-muted-foreground">{format(date, "MMM d, yyyy")}</div>;
    },
  },
];
