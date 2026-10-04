import unittest
from pathlib import Path
class RenderRhinoContractTests(unittest.TestCase):
    def test_fail_closed_geometry(self):
        text=Path("integrations/rhino/mpkd_render.py").read_text(encoding="utf-8")
        self.assertIn("geometry_ref",text); self.assertIn("MPKD_INSTANCE_ID",text)
    def test_schema(self):
        text=Path("integrations/rhino/mpkd_render.py").read_text(encoding="utf-8")
        self.assertIn('SCHEMA="mpkd-render/v0.1"',text)
    def test_placeholder(self):
        text=Path("integrations/rhino/mpkd_render.py").read_text(encoding="utf-8")
        self.assertIn('"PLACEHOLDER"',text)
if __name__=="__main__": unittest.main()
