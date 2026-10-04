# MPKD Render Scene — Grasshopper adapter boundary

Grasshopper consumes the mpkd-render/v0.1 scene JSON as a read/projection contract.

Inputs: scene JSON, project/version, instance_id/catalog_id, verification state, camera, lighting.

Rules:
1. Preserve instance_id and catalog_id.
2. Route VERIFIED, PENDING and PLACEHOLDER to distinct display states.
3. Do not create engineering semantics.
4. Do not promote verification state.
5. Do not modify MPKD parameters directly.
6. Any edit must become an MPKD/CAD patch and pass kernel validation.

The geometry provider remains an adapter. The render contract never invents geometry from geometry_ref.
