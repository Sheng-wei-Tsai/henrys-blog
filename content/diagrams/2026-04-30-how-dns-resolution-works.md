---
title: "DNS Resolution Step by Step"
date: "2026-04-30"
topic: "Networking"
difficulty: "beginner"
mermaid: |
  sequenceDiagram
    autonumber
    participant B as Browser
    participant R as Recursive Resolver
    participant T as TLD Nameserver
    participant A as Authoritative NS
    B->>R: Where is bytebytego.com?
    R->>T: Ask .com nameserver
    T-->>R: Ask ns1.bytebytego.com
    R->>A: Where is bytebytego.com?
    A-->>R: 104.21.44.1
    R-->>B: 104.21.44.1 (cached TTL 300s)
---

DNS turns human-readable names into IP addresses. The recursive resolver does the legwork — it asks the root, then the TLD (.com), then the authoritative nameserver, then caches the answer.
