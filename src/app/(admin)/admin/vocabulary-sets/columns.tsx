"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { format } from "date-fns";

export type VocabSetRow = {
  id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  profiles: { email: string } | null;
  created_at: string;
};

export const columns: ColumnDef<VocabSetRow>[] = [
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
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div className="font-medium max-w-[200px] truncate">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "profiles.email",
    header: "Author",
    cell: ({ row }) => <div>{row.original.profiles?.email || "-"}</div>,
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const isPublic = row.getValue("visibility") === "public";
      return (
        <Badge variant={isPublic ? "default" : "secondary"}>
          {isPublic ? "Public" : "Private"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{format(date, "MMM d, yyyy")}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const set = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href={`/admin/vocabulary-sets/${set.id}`} className="w-full">View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {set.visibility === "public" ? "Make Private" : "Make Public"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete Set</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
