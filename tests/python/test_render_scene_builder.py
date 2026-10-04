import tempfile,unittest
from pathlib import Path
from packages.mpkd_kernel.render_scene_builder import *
def m():
 return {"schema":SCHEMA,"project_id":"P1","project_version":1,"renderer_version":"test","approved":False,"profile":"TECHNICAL","camera":{"camera_id":"TOP","position_mm":[0,0,3000],"target_mm":[0,0,0],"projection":"orthographic"},"lighting":{"lighting_id":"technical","environment":"neutral"},"materials":list(MATERIALS),"provenance":{"source":"test","prompt_authority":False,"image_authority":False},"objects":[{"instance_id":"i"+str(i),"catalog_id":"c"+str(i),"verification_state":s,"geometry_ref":"catalog:c"+str(i),"material_id":MATERIALS[i],"source_ref":"catalog://c"+str(i)} for i,s in enumerate(VISUAL_STATES)]}
class TestSceneBuilder(unittest.TestCase):
 def test_manifest_and_states(self): validate_manifest(m()); self.assertEqual(len(VISUAL_STATES),5)
 def test_idempotent_create_update(self):
  a=MockRhinoApi(); b=SceneBuilder(a); self.assertEqual(b.build(m())["actions"],["created"]*5); self.assertEqual(b.build(m())["actions"],["updated"]*5); self.assertEqual(len(a.objects),5)
 def test_prompt_image_not_authority(self):
  x=m(); x["objects"][0]["source_ref"]=None; x["objects"][0]["geometry_ref"]="prompt:box"
  with self.assertRaises(ManifestError): SceneBuilder().build(x)
 def test_approval_fail_closed(self):
  x=m(); x["approved"]=True
  with self.assertRaises(ManifestError): validate_manifest(x)
 def test_material_profiles_cameras(self): self.assertEqual((len(MATERIALS),len(PROFILES),len(CAMERAS)),(6,3,4))
 def test_reports_hash_provenance(self):
  x=m(); p=SceneBuilder().build(x)
  with tempfile.TemporaryDirectory() as d:
   a=write_reports(x,p,d); self.assertTrue((Path(d)/"preview.json").exists()); self.assertEqual(len(p["scene_hash"]),64); self.assertFalse(a["engineering_approval"])
 def test_deterministic_hash(self): self.assertEqual(sha256(m()),sha256(m()))
if __name__=="__main__": unittest.main()
