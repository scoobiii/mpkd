"""MPKD Render v1 deterministic Scene Builder."""
import hashlib,json,time
from pathlib import Path
SCHEMA="mpkd-render/v1"
VISUAL_STATES=("VERIFIED","PENDING","PLACEHOLDER","BLOCKED","CONFLICT")
MATERIALS=("stainless","glass","ceramic","paint","wood","technical")
MATERIAL_DEFINITIONS={k:{"id":k,"kind":"generic","roughness":r} for k,r in {
 "stainless":0.32,"glass":0.08,"ceramic":0.28,"paint":0.45,"wood":0.55,"technical":0.62}.items()}
PROFILES=("TECHNICAL","COORDINATION","PRESENTATION")
PROFILE_PRESETS={k:{"id":k,"lighting":"neutral"} for k in PROFILES}
CAMERAS=("TOP","FRONT","PERSPECTIVE","AXONOMETRIC")
CAMERA_PRESETS={
 "TOP":{"position_mm":[0,0,3000],"target_mm":[0,0,0],"projection":"orthographic"},
 "FRONT":{"position_mm":[0,-3000,1500],"target_mm":[0,0,900],"projection":"perspective"},
 "PERSPECTIVE":{"position_mm":[2500,-2500,1800],"target_mm":[0,0,900],"projection":"perspective"},
 "AXONOMETRIC":{"position_mm":[2500,-2500,2500],"target_mm":[0,0,700],"projection":"orthographic"}}
class ManifestError(ValueError): pass
def canonical_json(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)
def sha256(v): return hashlib.sha256(canonical_json(v).encode()).hexdigest()
def validate_manifest(m):
 if m.get("schema")!=SCHEMA: raise ManifestError("invalid schema")
 for k in ("project_id","project_version","renderer_version","objects","camera","profile","lighting","materials"):
  if k not in m: raise ManifestError("missing "+k)
 if m["profile"] not in PROFILES or m["camera"].get("camera_id") not in CAMERAS: raise ManifestError("invalid profile/camera")
 if len(m["materials"])!=6 or set(m["materials"])!=set(MATERIALS): raise ManifestError("six generic materials required")
 if len(m["camera"].get("position_mm",[]))!=3 or len(m["camera"].get("target_mm",[]))!=3: raise ManifestError("invalid camera")
 seen=set()
 for o in m["objects"]:
  for k in ("instance_id","catalog_id","verification_state","geometry_ref","material_id"):
   if not o.get(k): raise ManifestError("missing "+k)
  if o["verification_state"] not in VISUAL_STATES: raise ManifestError("invalid state")
  if o["material_id"] not in MATERIALS: raise ManifestError("unknown material")
  if o["instance_id"] in seen: raise ManifestError("duplicate instance_id")
  seen.add(o["instance_id"])
 if m.get("approved") and any(o["verification_state"]!="VERIFIED" for o in m["objects"]): raise ManifestError("approval requires VERIFIED")
 return m
class MockRhinoApi:
 def __init__(self): self.objects={}
 def upsert(self,o):
  action="created" if o["instance_id"] not in self.objects else "updated"; self.objects[o["instance_id"]]=dict(o); return action
class SceneBuilder:
 def __init__(self,api=None): self.api=api or MockRhinoApi()
 def build(self,m):
  validate_manifest(m); t=time.perf_counter(); actions=[]
  for o in sorted(m["objects"],key=lambda x:x["instance_id"]):
   if o["verification_state"]=="VERIFIED" and not o.get("source_ref"): raise ManifestError("VERIFIED object lacks source_ref")
   obj={k:o[k] for k in ("instance_id","catalog_id","verification_state","geometry_ref","material_id")}
   obj["material"]=MATERIAL_DEFINITIONS[o["material_id"]]
   obj["metadata"]={"project_id":m["project_id"],"project_version":str(m["project_version"]),"source_ref":o.get("source_ref"),"prompt_authority":False,"image_authority":False}
   actions.append(self.api.upsert(obj))
  p={"schema":"mpkd-render-preview/v1","project_id":m["project_id"],"project_version":m["project_version"],"profile":m["profile"],"profile_config":PROFILE_PRESETS[m["profile"]],"camera":m["camera"],"camera_preset":CAMERA_PRESETS[m["camera"]["camera_id"]],"object_count":len(m["objects"]),"actions":actions,"objects":[self.api.objects[k] for k in sorted(self.api.objects)]}
  p["preview_time_ms"]=round((time.perf_counter()-t)*1000,3); p["scene_hash"]=sha256(p); return p
def write_reports(m,p,directory):
 d=Path(directory); d.mkdir(parents=True,exist_ok=True)
 a={"schema":"mpkd-render-audit/v1","project_id":m["project_id"],"project_version":m["project_version"],"renderer_version":m["renderer_version"],"profile":m["profile"],"camera":m["camera"],"objects":m["objects"],"provenance":m.get("provenance",{}),"scene_hash":p["scene_hash"],"manifest_hash":sha256(m),"preview_time_ms":p["preview_time_ms"],"engineering_approval":False}
 (d/"preview.json").write_text(canonical_json(p)+"\n"); (d/"audit.json").write_text(canonical_json(a)+"\n"); (d/"manifest.sha256").write_text(sha256(m)+"\n"); return a
