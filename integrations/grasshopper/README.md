# MPKD CAD interoperability

mpkd-cad/v1 is the interoperability contract between the MPKD semantic kernel and Rhino/Grasshopper.

Rules:
- MPKD remains semantic source of truth.
- instance_id is the stable project identity.
- catalog_id identifies the catalog component.
- Rhino updates by MPKD_INSTANCE_ID.
- Orphans are reported, never blindly deleted.
- coordinates in origin_mm/points_mm are normalized to millimetres.
- unverified catalog components remain explicitly unverified.
- Grasshopper/Rhino edits must return as MPKD diff/patch rather than silently becoming authoritative.
