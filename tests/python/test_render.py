import sys, unittest
from dataclasses import dataclass
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/"packages"))
from mpkd_kernel.render import Camera, Lighting, build_render_scene
@dataclass
class C:
 component_id:str; manufacturer:str="M"; model:str="X"; source_ref:str="S"; verified:bool=True
@dataclass
class I:
 instance_id:str; component_id:str
class Cat:
 def __init__(self,c): self.components=c
@dataclass
class P:
 project_id:str="P"; version:int=1; components:tuple=(); validation_approved:bool=False
class RenderTests(unittest.TestCase):
 def setup(self,verified=True):
  p=P(components=(I("i1","c1"),I("i2","c2")))
  c=Cat({"c1":C("c1",verified=verified),"c2":C("c2",verified=verified)})
  cam=Camera("cam",(0,0,3000),(0,0,0)); light=Lighting("key","daylight",())
  return p,c,cam,light
 def test_deterministic(self):
  p,c,cam,l=self.setup(); a=build_render_scene(p,c,cam,l).canonical_json(); self.assertEqual(a,build_render_scene(p,c,cam,l).canonical_json())
 def test_identity_and_hash(self):
  p,c,cam,l=self.setup(); s=build_render_scene(p,c,cam,l); self.assertEqual([o.instance_id for o in s.objects],["i1","i2"]); self.assertEqual(len(s.content_hash()),64)
 def test_unverified_pending_and_warning(self):
  p,c,cam,l=self.setup(False); s=build_render_scene(p,c,cam,l); self.assertTrue(all(o.verification_state=="PENDING" for o in s.objects)); self.assertTrue(any("RENDER_PENDING" in w for w in s.warnings))
 def test_approval_is_fail_closed(self):
  p,c,cam,l=self.setup()
  with self.assertRaises(ValueError): build_render_scene(p,c,cam,l,approved=True)
 def test_approved_scene(self):
  p,c,cam,l=self.setup(); p.validation_approved=True; s=build_render_scene(p,c,cam,l,approved=True); self.assertTrue(s.approved); self.assertNotIn("VISUALIZATION_NOT_ENGINEERING_APPROVAL",s.warnings)
if __name__=="__main__": unittest.main()
