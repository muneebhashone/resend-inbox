import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery, formatOperator } from "./parse-query";
import {
  applyDraft,
  removeOperatorAt,
  serializeQuery,
  addOperator,
} from "./serialize-query";

describe("parseQuery", () => {
  it("parses free text only", () => {
    assert.deepEqual(parseQuery("invoice payment"), {
      operators: [],
      freeText: ["invoice", "payment"],
    });
  });

  it("parses multiple operators and free text", () => {
    assert.deepEqual(parseQuery("from:alice is:unread invoice"), {
      operators: [
        { kind: "from", value: "alice" },
        { kind: "is", value: "unread" },
      ],
      freeText: ["invoice"],
    });
  });

  it("parses quoted values", () => {
    assert.deepEqual(parseQuery('from:"Alice Smith" subject:"q3 report"'), {
      operators: [
        { kind: "from", value: "Alice Smith" },
        { kind: "subject", value: "q3 report" },
      ],
      freeText: [],
    });
  });

  it("treats unknown operators as free text", () => {
    assert.deepEqual(parseQuery("cc:bob label:work"), {
      operators: [],
      freeText: ["cc:bob", "label:work"],
    });
  });

  it("treats invalid is/has/date values as free text", () => {
    assert.deepEqual(parseQuery("is:foo has:image after:tomorrow"), {
      operators: [],
      freeText: ["is:foo", "has:image", "after:tomorrow"],
    });
  });

  it("parses valid dates and has:attachment", () => {
    assert.deepEqual(
      parseQuery("has:attachment after:2026-01-01 before:2026-02-01"),
      {
        operators: [
          { kind: "has", value: "attachment" },
          { kind: "after", value: "2026-01-01" },
          { kind: "before", value: "2026-02-01" },
        ],
        freeText: [],
      },
    );
  });

  it("handles empty and whitespace", () => {
    assert.deepEqual(parseQuery("   "), { operators: [], freeText: [] });
    assert.deepEqual(parseQuery(""), { operators: [], freeText: [] });
  });
});

describe("serializeQuery", () => {
  it("round-trips operators and free text", () => {
    const q = 'from:"Alice Smith" is:starred invoice';
    assert.equal(serializeQuery(parseQuery(q)), q);
  });

  it("quotes values with spaces", () => {
    assert.equal(
      formatOperator({ kind: "from", value: "Alice Smith" }),
      'from:"Alice Smith"',
    );
  });
});

describe("serialize helpers", () => {
  it("applyDraft merges chips with draft operators", () => {
    const next = applyDraft([{ kind: "from", value: "alice" }], "is:unread hi");
    assert.equal(next, "from:alice is:unread hi");
  });

  it("dedupes operators", () => {
    const next = applyDraft(
      [{ kind: "from", value: "alice" }],
      "from:alice invoice",
    );
    assert.equal(next, "from:alice invoice");
  });

  it("removeOperatorAt drops a chip", () => {
    assert.equal(
      removeOperatorAt("from:alice is:unread hi", 0),
      "is:unread hi",
    );
  });

  it("addOperator appends", () => {
    assert.equal(
      addOperator("invoice", { kind: "has", value: "attachment" }),
      "has:attachment invoice",
    );
  });
});
