---
title: "How a Load Balancer Works"
date: "2026-04-30"
topic: "Networking"
difficulty: "beginner"
mermaid: |
  flowchart TD
    C1[Client A]
    C2[Client B]
    C3[Client C]
    LB[Load Balancer\nRound-robin / Least-conn]
    S1[Server 1]
    S2[Server 2]
    S3[Server 3]
    C1 & C2 & C3 --> LB
    LB --> S1 & S2 & S3
    style LB fill:#c0281c,color:#fff,stroke:#140a05,stroke-width:2px
---

A load balancer sits in front of your servers and distributes incoming requests so no single server gets overwhelmed. Round-robin sends requests in turn; least-connections routes to whichever server is least busy.
