# MPKD Render Engine v0.1
Status: implementation slice.

The renderer is a projection of the MPKD technical/parametric model. It does not alter, repair, hide, invent, or approve project geometry.

Implemented contract:
- project_id / project_version
- instance_id / catalog_id
- VERIFIED / PENDING states
- deterministic camera and lighting records
- scene canonicalization and SHA-256 content hash
- auditable scene report
- fail-closed engineering approval flag
- explicit visualization-not-engineering-approval warning

This slice creates an auditable scene manifest. Rhino/Grasshopper renderer bindings and final photorealistic backend are subsequent adapters; no claim of photorealistic rendering is made by this implementation alone.
