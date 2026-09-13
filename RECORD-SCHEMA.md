# Rigging 101 learner record schema

The optional device record uses local storage key `cq.rig101.recordEnvelope`.
It is a versioned JSON envelope with `schemaVersion`, `contentVersion`,
`savedAt`, `expiresAt`, `dataClass`, `storage`, and `data`. The learner chooses
30, 90, or 365 days of retention, or session-only storage. Delete removes the
envelope immediately and suppresses unload-time recreation. Passive timing and
an untouched instructor agenda do not create a record for an anonymous visitor;
the envelope begins only after an explicit learner action creates progress or a
preference.

The exported JSON contains:

- optional learner name and employee ID;
- guided, scenario, and final-knowledge-check status;
- per-item attempt counts and the successful attempt number;
- timestamped attempt events with skill, source, confidence, and correctness;
- high-confidence error count;
- required skill-station evidence: 22 case results across seven skills, submitted
  field values, timestamped attempts, correctness, and coaching use;
- time on task in milliseconds by tool;
- schema/content versions and export timestamp; and
- a separate `fieldPerformance` status that remains `not_observed` until an
  instructor or employer performs practical verification.

This application record documents knowledge demonstrated in the learning lab.
It is not a qualification record or lift authorization.

The copied progress summary ends with a local checksum intended only to detect
copying errors. Because it is generated in the browser, it is not a digital
signature, proof of authenticity, or employer verification.

The current course stores station state under `skillRecord` inside
the same retention-controlled envelope. Draft entries survive language changes
and reloads. A corrected result keeps its prior attempts; opening the worked example is
recorded separately from independent first-attempt success. Clearing progress
or deleting the record removes the station evidence too. The exported `skills`
object contains drafts and attempts. The summary under `knowledge.skillChecks`
reports current mastery, recalculated from the latest submitted values.

Course completion requires all six guided decisions, all 22 skill checks, and
the final knowledge check. The completion event cannot fire from the older quiz
alone. Loading a record from an older content version invalidates the old final
quiz result and session, because assessment content changed, while preserving
other existing learner evidence. Legacy `skillStationsV1` evidence is included
in `archivedVersions`, and must not award credit for revised tasks. Practical
field performance remains separate. Schema version: `3.0`; content: `2026.09.13.1`.
