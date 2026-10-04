"""MPKD Render Engine v0.1: deterministic, auditable scene projection."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Mapping
import hashlib, json
from pathlib import Path

SCHEMA="mpkd-render/v0.1"
STATES={"VERIFIED","PENDING","PLACEHOLDER"}

@dataclass(frozen=True)
class RenderObject:
    instance_id:str
    catalog_id:str
    verification_state:str
    material_id:str
    geometry_ref:str
    metadata:dict[str,Any]=field(default_factory=dict)
    def to_dict(self):
        return {"instance_id":self.instance_id,"catalog_id":self.catalog_id,
                "verification_state":self.verification_state,"material_id":self.material_id,
                "geometry_ref":self.geometry_ref,"metadata":_sorted(self.metadata)}

@dataclass(frozen=True)
class Camera:
    camera_id:str
    position_mm:tuple[float,float,float]
    target_mm:tuple[float,float,float]
    projection:str="perspective"
    def to_dict(self): return {"camera_id":self.camera_id,"position_mm":list(self.position_mm),
        "target_mm":list(self.target_mm),"projection":self.projection}

@dataclass(frozen=True)
class Lighting:
    lighting_id:str
    environment:str
    fixtures:tuple[dict[str,Any],...]=()
    def to_dict(self): return {"lighting_id":self.lighting_id,"environment":self.environment,
        "fixtures":[_sorted(x) for x in self.fixtures]}

@dataclass(frozen=True)
class RenderScene:
    project_id:str
    project_version:int
    source_schema:str
    objects:tuple[RenderObject,...]
    camera:Camera
    lighting:Lighting
    renderer_version:str="mpkd-render/0.1"
    approved:bool=False
    warnings:tuple[str,...]=()
    def to_dict(self):
        return {"schema":SCHEMA,"project_id":self.project_id,"project_version":self.project_version,
          "source_schema":self.source_schema,"renderer_version":self.renderer_version,
          "approved":self.approved,"objects":[x.to_dict() for x in self.objects],
          "camera":self.camera.to_dict(),"lighting":self.lighting.to_dict(),
          "warnings":list(self.warnings)}
    def canonical_json(self): return json.dumps(self.to_dict(),ensure_ascii=False,sort_keys=True,separators=(",",":"))
    def content_hash(self): return hashlib.sha256(self.canonical_json().encode()).hexdigest()

def _sorted(x:Mapping[str,Any]): return {str(k):x[k] for k in sorted(x)}
def _get(x,n,d=None): return x.get(n,d) if isinstance(x,Mapping) else getattr(x,n,d)

def build_render_scene(project:Any, catalog:Any, camera:Camera, lighting:Lighting,
                       *, approved:bool=False, renderer_version:str="mpkd-render/0.1")->RenderScene:
    pid=str(_get(project,"project_id",_get(project,"id","")))
    version=int(_get(project,"version",1))
    if not pid: raise ValueError("project_id obrigatório")
    if approved and not _get(project,"validation_approved",False):
        raise ValueError("Render não pode aprovar projeto sem estado técnico aprovado")
    components=_get(project,"components",()) or ()
    if isinstance(components,Mapping): components=components.values()
    objects=[]; warnings=[]
    cmap=_get(catalog,"components",{}) or {}
    for inst in sorted(components,key=lambda x:str(_get(x,"instance_id",_get(x,"id","")))):
        iid=str(_get(inst,"instance_id",_get(inst,"id","")))
        cid=str(_get(inst,"component_id",_get(inst,"catalog_id","")))
        comp=cmap.get(cid) if isinstance(cmap,Mapping) else None
        if comp is None: raise ValueError(f"Componente desconhecido: {cid}")
        verified=bool(_get(comp,"verified",False))
        state="VERIFIED" if verified else "PENDING"
        geometry_ref=f"catalog:{cid}"
        objects.append(RenderObject(iid,cid,state,f"catalog:{cid}:material",
                                    geometry_ref,{"manufacturer":_get(comp,"manufacturer"),
                                                  "model":_get(comp,"model"),
                                                  "source_ref":_get(comp,"source_ref")}))
        if state!="VERIFIED": warnings.append(f"RENDER_{state}:{iid}:{cid}")
    if not approved: warnings.append("VISUALIZATION_NOT_ENGINEERING_APPROVAL")
    return RenderScene(pid,version,"mpkd-cad/v1",tuple(objects),camera,lighting,
                       renderer_version,approved,tuple(sorted(set(warnings))))

def write_scene(scene:RenderScene,path:str|Path)->Path:
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(scene.canonical_json()+"\n",encoding="utf-8"); return p

def write_audit(scene:RenderScene,path:str|Path)->Path:
    payload={"schema":"mpkd-render-audit/v0.1","scene_hash_sha256":scene.content_hash(),
             "project_id":scene.project_id,"project_version":scene.project_version,
             "renderer_version":scene.renderer_version,"object_count":len(scene.objects),
             "objects":[{"instance_id":o.instance_id,"catalog_id":o.catalog_id,
                         "verification_state":o.verification_state} for o in scene.objects],
             "camera":scene.camera.to_dict(),"lighting":scene.lighting.to_dict(),
             "approved":scene.approved,"warnings":list(scene.warnings)}
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(payload,ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8"); return p
