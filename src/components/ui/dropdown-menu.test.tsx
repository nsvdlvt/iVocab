import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { AdminTopbar } from "@/components/admin/layout/topbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock changeUserRoleAction
vi.mock("@/actions/admin/users", () => ({
  changeUserRoleAction: vi.fn(),
}));

// Mock NotificationBell
vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

describe("DropdownMenu Base UI Composition", () => {
  it("throws MenuGroupContext error when DropdownMenuLabel is rendered outside DropdownMenuGroup", () => {
    const originalError = console.error;
    console.error = vi.fn();
    try {
      expect(() => {
        renderToString(<DropdownMenuLabel>Standalone Label</DropdownMenuLabel>);
      }).toThrow(/MenuGroupContext is missing/);
    } finally {
      console.error = originalError;
    }
  });

  it("renders DropdownMenuLabel inside DropdownMenuGroup without throwing MenuGroupContext error", () => {
    expect(() => {
      renderToString(
        <DropdownMenu open>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Suspend</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }).not.toThrow();
  }, 20000);

  it("renders AdminTopbar without MenuGroupContext errors", () => {
    expect(() => {
      renderToString(
        <AdminTopbar
          user={{
            id: "admin-1",
            user_metadata: { full_name: "Admin Tester" },
            email: "admin@test.com",
          }}
        />
      );
    }).not.toThrow();
  }, 20000);

  it("renders admin users columns actions dropdown without error", async () => {
    const { columns } = await import("@/app/(admin)/admin/users/columns");
    interface ColLike {
      id?: string;
      cell: (props: { row: { original: unknown; getValue: () => string } }) => React.ReactNode;
    }
    const actionsCol = (columns as unknown as ColLike[]).find((c) => c.id === "actions");
    expect(actionsCol).toBeDefined();

    expect(() => {
      renderToString(
        actionsCol!.cell({
          row: { original: { id: "user-1", email: "user@test.com", role: "member" }, getValue: () => "member" },
        })
      );
    }).not.toThrow();
  }, 20000);

  it("renders admin vocabulary-sets columns actions dropdown without error", async () => {
    const { columns } = await import("@/app/(admin)/admin/vocabulary-sets/columns");
    interface ColLike {
      id?: string;
      cell: (props: { row: { original: unknown; getValue: () => string } }) => React.ReactNode;
    }
    const actionsCol = (columns as unknown as ColLike[]).find((c) => c.id === "actions");
    expect(actionsCol).toBeDefined();

    expect(() => {
      renderToString(
        actionsCol!.cell({
          row: { original: { id: "set-1", title: "Vocab Set", visibility: "public" }, getValue: () => "Vocab Set" },
        })
      );
    }).not.toThrow();
  }, 20000);

  it("renders UsersTableClient without MenuGroupContext errors", async () => {
    const { UsersTableClient } = await import("@/components/admin/users/users-table-client");
    expect(() => {
      renderToString(
        <UsersTableClient
          users={[
            {
              id: "user-1",
              email: "member@example.com",
              role: "member",
              display_name: "Member User",
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              level: null,
              longest_streak: null,
              daily_goal: null,
              last_activity_at: null,
              streak: 3,
            },
          ]}
          totalCount={1}
          pageSize={10}
          totalPages={1}
          currentPage={1}
          search=""
          roleFilter="all"
        />
      );
    }).not.toThrow();
  }, 20000);
});
