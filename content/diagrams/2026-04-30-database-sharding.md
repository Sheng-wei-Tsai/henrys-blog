---
title: "Database Sharding"
date: "2026-04-30"
topic: "Databases"
difficulty: "intermediate"
mermaid: |
  flowchart TD
    App[Application]
    R[Shard Router\nhash(user_id) % 3]
    S0[(Shard 0\nuser_id 0–33%)]
    S1[(Shard 1\nuser_id 33–66%)]
    S2[(Shard 2\nuser_id 66–100%)]
    App --> R
    R --> S0
    R --> S1
    R --> S2
    style R fill:#c0281c,color:#fff,stroke:#140a05,stroke-width:2px
---

Sharding splits a single large database into smaller pieces (shards) spread across multiple servers. A shard router uses a key (e.g. user_id) to decide which shard holds the data. Reads and writes go only to the relevant shard — no full-table scans across all data.
