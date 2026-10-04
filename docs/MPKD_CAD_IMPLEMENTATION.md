# MPKD CAD v1

The contract is a projection of the MPKD semantic model, not a new source of truth.

Flow:

MPKD semantic model -> mpkd-cad/v1 JSON -> RhinoPython / Grasshopper -> Rhino document

Stable identity:
- instance_id
- catalog_id

Rhino matching uses MPKD_INSTANCE_ID. Missing objects are returned as orphans and are not deleted.

Units:
The project may declare mm, cm or m. CAD coordinates are normalized to millimetres.

Verification:
Unverified catalog components produce an explicit warning and retain verified=false metadata.

The next interoperability step is Rhino/GH diff capture:
Rhino/GH edit -> patch -> MPKD validation -> new semantic version.
