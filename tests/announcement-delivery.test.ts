import { beforeAll, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const state: {
  status: string;
  attempts: number;
  leaseId: string | null;
  lastError: string | null;
  sent: Array<Record<string, unknown>>;
  fail: boolean;
  recipientQuery: Record<string, unknown> | null;
  created: Record<string, unknown> | null;
  defaultValue: boolean | null;
} = {
  status: "PENDING",
  attempts: 0,
  leaseId: null,
  lastError: null,
  sent: [],
  fail: false,
  recipientQuery: null,
  created: null,
  defaultValue: null,
};

const tx = {
  class: { findUnique: mock(async () => ({ name: "Class one" })) },
  user: {
    findMany: mock(async (input: Record<string, unknown>) => {
      state.recipientQuery = input;
      return [
        { id: "student-1", email: "one@example.test" },
        { id: "student-2", email: "two@example.test" },
      ];
    }),
    update: mock(async ({ data }: { data: { announcementEmailDefault: boolean } }) => {
      state.defaultValue = data.announcementEmailDefault;
    }),
  },
  announcement: {
    create: mock(async ({ data }: { data: Record<string, unknown> }) => {
      state.created = data;
      return data;
    }),
  },
};

const prisma = {
  class: { findUnique: mock(async () => ({ id: "class-1" })) },
  $transaction: mock(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  announcementDelivery: {
    updateMany: mock(async ({ data }: { data: Record<string, unknown> }) => {
      if (data.status === "PROCESSING" && state.status === "PENDING") {
        state.status = "PROCESSING";
        state.attempts += 1;
        state.leaseId = data.leaseId as string;
        return { count: 1 };
      }
      if (data.status === "SENT" && state.status === "PROCESSING") {
        state.status = "SENT";
        state.leaseId = null;
        return { count: 1 };
      }
      if (data.status === "PENDING" && state.status === "PROCESSING") {
        state.status = "PENDING";
        state.leaseId = null;
        state.lastError = data.lastError as string;
        return { count: 1 };
      }
      return { count: 0 };
    }),
    findFirst: mock(async () => {
      if (state.status !== "PROCESSING") return null;
      return {
        id: "delivery-1",
        recipientEmail: "student@example.test",
        idempotencyKey: "announcement:one:student-1",
        attempts: state.attempts,
        leaseId: state.leaseId,
        payload: { title: "Update", body: "Message", className: "Class one" },
      };
    }),
    findMany: mock(async () => []),
  },
};

mock.module("server-only", () => ({}));
mock.module("@/lib/announcement-store", () => ({ prisma }));
mock.module("@/lib/env", () => ({ appUrl: () => "https://example.test" }));
mock.module("@/lib/password-reset", () => ({ emailRetryDelayMs: () => 60_000 }));
mock.module("@/lib/dal", () => ({ requireAdmin: mock(async () => ({ id: "admin-1" })) }));
mock.module("next/cache", () => ({ revalidatePath: mock(() => {}) }));
mock.module("next/server", () => ({ after: mock(() => {}) }));
mock.module("@/lib/announcement-email", () => ({
  sendQueuedAnnouncementEmail: mock(async (args: Record<string, unknown>) => {
    if (state.fail) throw new Error("provider unavailable");
    state.sent.push(args);
  }),
}));

let delivery: typeof import("../lib/announcement-delivery");
let actions: typeof import("../app/(app)/admin/announcements/actions");
let MarkdownContent: typeof import("../components/announcements/markdown-content").MarkdownContent;
beforeAll(async () => {
  delivery = await import("../lib/announcement-delivery");
  actions = await import("../app/(app)/admin/announcements/actions");
  ({ MarkdownContent } = await import("../components/announcements/markdown-content"));
});

describe("announcement publication", () => {
  test("snapshots every verified user into durable deliveries and saves the admin default", async () => {
    const result = await actions.createAnnouncement({
      title: "Program update",
      body: "**Read this**",
      classId: "class-1",
      emailRequested: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipients).toBe(2);
    expect(state.recipientQuery).toMatchObject({
      where: { emailVerified: true },
    });
    const deliveries = (state.created?.deliveries as { createMany: { data: unknown[] } }).createMany.data;
    expect(deliveries).toHaveLength(2);
    expect(deliveries).toMatchObject([
      { recipientEmail: "one@example.test", payload: { title: "Program update", className: "Class one" } },
      { recipientEmail: "two@example.test", payload: { title: "Program update", className: "Class one" } },
    ]);
    expect(state.defaultValue).toBe(true);
  });
});

describe("announcement delivery", () => {
  test("delivers the original announcement snapshot with an idempotency key", async () => {
    const result = await delivery.deliverAnnouncementDelivery("delivery-1");
    expect(result.delivered).toBe(true);
    expect(state.status).toBe("SENT");
    expect(state.sent[0]).toMatchObject({
      to: "student@example.test",
      title: "Update",
      className: "Class one",
      idempotencyKey: "announcement:one:student-1",
    });
  });

  test("keeps provider failures pending for retry", async () => {
    state.status = "PENDING";
    state.attempts = 0;
    state.leaseId = null;
    state.fail = true;
    const reportError = console.error;
    console.error = () => {};
    let result: Awaited<ReturnType<typeof delivery.deliverAnnouncementDelivery>>;
    try {
      result = await delivery.deliverAnnouncementDelivery("delivery-1");
    } finally {
      console.error = reportError;
      state.fail = false;
    }

    expect(result.delivered).toBe(false);
    expect(state.status).toBe("PENDING");
    expect(state.lastError).toBe("provider unavailable");
  });
});

describe("announcement Markdown", () => {
  test("renders GitHub-style formatting without allowing raw HTML execution", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        body: "**Important**\n\n- [x] Done\n\n<script>alert('unsafe')</script>",
      }),
    );

    expect(html).toContain("<strong>Important</strong>");
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain("<script>");
  });
});
