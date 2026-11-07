import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, within } from "@testing-library/react";

mock.module("@/components/people/invite-dialog", () => ({
  InviteDialog: ({ role }: { role: string }) => <button type="button">Invite {role.toLowerCase()}</button>,
}));

const { PeopleTabs } = await import("../components/people/people-tabs");
const { HideWhileSearching, SearchableRows } = await import("../components/people/people-search");

type Person = { id: string; name: string; email: string };

const students: Person[] = [
  { id: "s1", name: "Ada Lovelace", email: "ada@example.test" },
  { id: "s2", name: "Grace Hopper", email: "lovelace-fan@example.test" },
  { id: "s3", name: "Adam Smith", email: "adam@example.test" },
];
const admins: Person[] = [{ id: "a1", name: "Linus Torvalds", email: "linus@example.test" }];
const deleted: Person[] = [{ id: "d1", name: "Old Account", email: "old@example.test" }];

// Rows are rendered as plain nodes, the way the server page hands them over.
function table(people: Person[], noun: string, withInvite = false) {
  return (
    <table>
      <tbody>
        <SearchableRows
          noun={noun}
          colSpan={2}
          rows={people.map((person) => ({
            id: person.id,
            name: person.name,
            node: (
              <tr>
                <td>{person.name}</td>
                <td>{person.email}</td>
              </tr>
            ),
          }))}
        />
        {withInvite ? (
          <HideWhileSearching>
            <tr>
              <td>pending-invite@example.test</td>
            </tr>
          </HideWhileSearching>
        ) : null}
      </tbody>
    </table>
  );
}

function setup() {
  const view = render(
    <PeopleTabs
      names={{
        students: students.map((p) => p.name),
        admins: admins.map((p) => p.name),
        deleted: deleted.map((p) => p.name),
      }}
      students={table(students, "students", true)}
      admins={table(admins, "admins")}
      deleted={table(deleted, "deleted users")}
    />,
  );
  const box = view.getByRole("searchbox", { name: "Search people by name" }) as HTMLInputElement;
  const type = (value: string) => fireEvent.change(box, { target: { value } });
  const tabCount = (name: RegExp) => within(view.getByRole("tab", { name })).getByText(/^\d+$/).textContent;
  return { ...view, box, type, tabCount };
}

afterEach(cleanup);

describe("People search (client side)", () => {
  test("shows everyone when the box is empty", () => {
    const { getByText, tabCount } = setup();
    for (const person of students) getByText(person.name);
    getByText("pending-invite@example.test");
    expect(tabCount(/Students/)).toBe("3");
  });

  test("filters by name, ignoring case", () => {
    const { type, queryByText, getByText } = setup();
    type("ADA");
    getByText("Ada Lovelace");
    getByText("Adam Smith");
    expect(queryByText("Grace Hopper")).toBeNull();
  });

  test("searches the name only: another person's matching email does not show them", () => {
    const { type, queryByText, getByText } = setup();
    // Grace's email contains "lovelace" but her name does not.
    type("lovelace");
    getByText("Ada Lovelace");
    expect(queryByText("Grace Hopper")).toBeNull();
  });

  test("an email-only query finds nobody and says so", () => {
    const { type, getByText, queryByText } = setup();
    type("ada@example");
    getByText(/No students match/);
    expect(queryByText("Ada Lovelace")).toBeNull();
  });

  test("no matches shows the Empty state with the same message, and it goes away when matches return", () => {
    const { type, container } = setup();
    expect(container.querySelector('[data-slot="empty"]')).toBeNull();
    type("zzz");
    const empty = container.querySelector('[data-slot="empty"]');
    expect(empty).not.toBeNull();
    expect(empty?.querySelector('[data-slot="empty-title"]')?.textContent).toBe("No students match \u201czzz\u201d.");
    expect(empty?.closest("td")?.getAttribute("colspan")).toBe("2");
    type("ada");
    expect(container.querySelector('[data-slot="empty"]')).toBeNull();
  });

  test("the no-match message includes what was typed", () => {
    const { type, getByText } = setup();
    type("  zzz ");
    getByText(/No students match .zzz./);
  });

  test("pending invites have no name, so they are hidden while searching and back after", () => {
    const { type, queryByText } = setup();
    type("ada");
    expect(queryByText("pending-invite@example.test")).toBeNull();
    type("");
    expect(queryByText("pending-invite@example.test")).not.toBeNull();
  });

  test("tab counts follow the search", () => {
    const { type, tabCount } = setup();
    type("ad");
    expect(tabCount(/Students/)).toBe("2");
    expect(tabCount(/Admins/)).toBe("0");
    expect(tabCount(/Deleted/)).toBe("0");
    type("");
    expect(tabCount(/Students/)).toBe("3");
    expect(tabCount(/Admins/)).toBe("1");
  });

  test("the search stays when you switch tabs and applies to that tab too", () => {
    const { type, getByRole, getByText, queryByText } = setup();
    type("linus");
    getByText(/No students match/);
    fireEvent.click(getByRole("tab", { name: /Admins/ }));
    getByText("Linus Torvalds");
    fireEvent.click(getByRole("tab", { name: /Deleted/ }));
    getByText(/No deleted users match/);
    expect(queryByText("Old Account")).toBeNull();
  });

  test("the clear button and Escape both reset the search", () => {
    const { type, box, getByRole, getByText, queryByRole } = setup();
    type("zzz");
    getByText(/No students match/);
    fireEvent.click(getByRole("button", { name: "Clear search" }));
    expect(box.value).toBe("");
    getByText("Grace Hopper");
    expect(queryByRole("button", { name: "Clear search" })).toBeNull();

    type("ada");
    fireEvent.keyDown(box, { key: "Escape" });
    expect(box.value).toBe("");
    getByText("Grace Hopper");
  });

  test("the invite button still follows the active tab", () => {
    const { getByRole, queryByRole } = setup();
    getByRole("button", { name: "Invite student" });
    fireEvent.click(getByRole("tab", { name: /Admins/ }));
    getByRole("button", { name: "Invite admin" });
    fireEvent.click(getByRole("tab", { name: /Deleted/ }));
    expect(queryByRole("button", { name: /Invite/ })).toBeNull();
  });
});
