# MPKD Render v1

Five official visual states: VERIFIED, PENDING, PLACEHOLDER, BLOCKED, CONFLICT. They are visual/provenance states, never engineering approval.

SceneBuilder consumes only a validated mpkd-render/v1 manifest and performs idempotent upserts in MockRhinoApi by instance_id. Prompt and image are never geometry authority.

It produces technical preview.json, audit.json and manifest.sha256 with project/version, identity, source references and provenance.

Project limits: this repository does not replace an HVAC-R solver, validated lighting calculation, normative certification, image-to-technical-truth conversion, or engineering approval merely because a VUC proof exists.

Catalog references retain source, license and verification status. Proprietary data must not be redistributed without applicable permission.

MockRhinoApi proves deterministic adapter behavior, not full Rhino compatibility or photorealistic rendering.
