import assert from "node:assert/strict";
import test from "node:test";
import { getInboundAuthenticationVerdict } from "./authentication.ts";

const protectedDomains = ["themuneebh.com"];

test("filters an own-domain sender when SES reports a DMARC failure", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: '"AT&T My Account" <facilities@themuneebh.com>',
    headers: {
      "authentication-results":
        "amazonses.com; spf=none; dmarc=fail header.from=themuneebh.com;",
    },
    protectedDomains,
  });

  assert.deepEqual(verdict, {
    filter: true,
    domain: "themuneebh.com",
    dmarc: "fail",
  });
});

test("filters an own-domain sender when authoritative authentication is missing", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: "billing@themuneebh.com",
    headers: {},
    protectedDomains,
  });

  assert.deepEqual(verdict, {
    filter: true,
    domain: "themuneebh.com",
    dmarc: "missing",
  });
});

test("accepts an own-domain sender with an aligned SES DMARC pass", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: "Muneeb <hello@themuneebh.com>",
    headers: {
      "authentication-results":
        "amazonses.com; spf=pass; dkim=pass; dmarc=pass header.from=themuneebh.com;",
    },
    protectedDomains,
  });

  assert.deepEqual(verdict, { filter: false });
});

test("filters a DMARC pass that is aligned to a different domain", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: "hello@themuneebh.com",
    headers: {
      "authentication-results":
        "amazonses.com; dmarc=pass header.from=attacker.example;",
    },
    protectedDomains,
  });

  assert.deepEqual(verdict, {
    filter: true,
    domain: "themuneebh.com",
    dmarc: "misaligned",
  });
});

test("ignores untrusted authentication results placed before the SES result", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: "hello@themuneebh.com",
    headers: {
      "authentication-results":
        "attacker.example; dmarc=pass header.from=themuneebh.com; amazonses.com; dmarc=fail header.from=themuneebh.com;",
    },
    protectedDomains,
  });

  assert.deepEqual(verdict, {
    filter: true,
    domain: "themuneebh.com",
    dmarc: "fail",
  });
});

test("does not filter external senders based on their DMARC result", () => {
  const verdict = getInboundAuthenticationVerdict({
    from: "sender@example.com",
    headers: {
      "authentication-results":
        "amazonses.com; dmarc=fail header.from=example.com;",
    },
    protectedDomains,
  });

  assert.deepEqual(verdict, { filter: false });
});
