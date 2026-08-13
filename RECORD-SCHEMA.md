# Rigging 101 learner record schema

The optional device record uses local storage key `cq.rig101.recordEnvelope`.
It is a versioned JSON envelope with `schemaVersion`, `contentVersion`,
`savedAt`, `expiresAt`, `dataClass`, `storage`, and `data`. The learner chooses
30, 90, or 365 days of retention, or session-only storage. Delete removes the
envelope immediately.

The exported JSON contains:

- optional learner name and employee ID;
- guided, scenario, and final-knowledge-check status;
- per-item attempt counts and the successful attempt number;
- timestamped attempt events with skill, source, confidence, and correctness;
- high-confidence error count;
- time on task in milliseconds by tool;
- schema/content versions and export timestamp; and
- a separate `fieldPerformance` status that remains `not_observed` until an
  instructor or employer performs practical verification.

This application record documents knowledge demonstrated in the learning lab.
It is not a qualification record or lift authorization.
