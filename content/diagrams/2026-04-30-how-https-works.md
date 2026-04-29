---
title: "How HTTPS / TLS Handshake Works"
date: "2026-04-30"
topic: "Security"
difficulty: "beginner"
mermaid: |
  sequenceDiagram
    autonumber
    participant C as Client
    participant S as Server
    C->>S: ClientHello (supported ciphers)
    S-->>C: ServerHello + Certificate
    C->>C: Verify cert against CA
    C->>S: Pre-master secret (encrypted)
    S->>S: Derive session key
    C->>S: Finished (encrypted)
    S-->>C: Finished (encrypted)
    Note over C,S: All data now encrypted with session key
---

TLS negotiates a symmetric session key using asymmetric cryptography. The certificate proves the server's identity; the handshake produces a shared secret that neither side transmits directly.
