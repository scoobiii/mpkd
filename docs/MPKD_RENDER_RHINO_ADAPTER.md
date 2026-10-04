# MPKD Render → Rhino/Grasshopper adapter

This increment establishes the primary Rhino integration boundary for mpkd-render/v0.1.

MPKD semantic/parametric model → render scene manifest → Rhino projection → Grasshopper visualization.

The adapter preserves project/version/instance/catalog identity, maps verification state to render layers, updates existing Rhino objects by MPKD_INSTANCE_ID, never deletes Rhino orphans automatically, never invents geometry from a reference, and never changes engineering approval state.

Photorealistic rendering remains a later renderer backend. Rhino/Grasshopper is the interactive visualization adapter, not the semantic authority.

Rhino/GH edits must return through a diff/patch boundary before changing MPKD.
