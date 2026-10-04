"""Rhino adapter for mpkd-render/v0.1 scene manifests."""
from __future__ import annotations
import json
from pathlib import Path
SCHEMA="mpkd-render/v0.1"
STATE_LAYERS={"VERIFIED":"VERIFIED","PENDING":"PENDING","PLACEHOLDER":"PLACEHOLDER"}
def load_scene(path):
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema")!=SCHEMA: raise ValueError(f"Unsupported render schema: {data.get('schema')}")
    return data
def _ensure_layer(rs,name):
    if not rs.IsLayer(name): rs.AddLayer(name)
    return name
def _user_text(rs,guid,values):
    for key,value in values.items(): rs.SetUserText(guid,key,str(value))
def import_scene(path,rs=None):
    if rs is None:
        try: import rhinoscriptsyntax as rs
        except ImportError as exc: raise RuntimeError("Execute este adapter dentro do Rhino") from exc
    scene=load_scene(path); root="MPKD::09_RENDER"; _ensure_layer(rs,root)
    for state in STATE_LAYERS.values(): _ensure_layer(rs,f"{root}::{state}")
    updated=0; seen=set()
    for obj in scene["objects"]:
        iid=obj["instance_id"]; seen.add(iid)
        layer=f"{root}::{STATE_LAYERS.get(obj['verification_state'],'PENDING')}"
        _ensure_layer(rs,layer)
        existing=rs.ObjectsByUserText("MPKD_INSTANCE_ID",iid,select=False) or []
        if not existing: continue
        guid=existing[0]; updated+=1; rs.ObjectLayer(guid,layer)
        _user_text(rs,guid,{"MPKD_PROJECT_ID":scene["project_id"],"MPKD_PROJECT_VERSION":scene["project_version"],
          "MPKD_CATALOG_ID":obj["catalog_id"],"MPKD_VERIFICATION_STATE":obj["verification_state"],
          "MPKD_GEOMETRY_REF":obj["geometry_ref"],"MPKD_MATERIAL_ID":obj["material_id"]})
    return {"schema":"mpkd-render-rhino-report/v0.1","project_id":scene["project_id"],
      "project_version":scene["project_version"],"scene_schema":scene["schema"],"created":0,
      "updated":updated,"objects_in_scene":len(scene["objects"]),"seen_instance_ids":sorted(seen),
      "warnings":list(scene.get("warnings",[])),"approval":scene.get("approved",False)}
