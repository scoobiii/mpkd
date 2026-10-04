import json
import sys
import unittest
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages"))

from mpkd_kernel.cad import SCHEMA, CadExportError, export_cad_document, load_cad_json

@dataclass(frozen=True)
class Point:
    x: float; y: float; z: float

@dataclass(frozen=True)
class Transform:
    origin: Point
    rotation_z_deg: float = 0

@dataclass
class Component:
    component_id: str
    manufacturer: str
    model: str = "MODEL"
    category: str = "equipment"
    dimensions_mm: tuple = (1000, 900, 900)
    maintenance_clearance_mm: float = 900
    source_ref: str = "source"
    verified: bool = True

@dataclass
class Instance:
    instance_id: str
    component_id: str
    transform: Transform
    parameters: dict = field(default_factory=dict)

@dataclass
class Segment:
    segment_id: str
    points: tuple
    diameter_mm: float | None = None
    flow_rate_m3_h: float | None = None
    utility: str = "exhaust"

@dataclass
class Network:
    network_id: str
    utility: str
    segments: tuple

@dataclass
class Project:
    project_id: str = "pilot"
    version: int = 1
    units: str = "mm"
    components: tuple = ()
    networks: tuple = ()

class Catalog:
    def __init__(self, components): self.components = components

class CadContractTests(unittest.TestCase):
    def make_project(self):
        catalog = Catalog({
            "angelo-po:generic": Component("angelo-po:generic", "Angelo Po"),
            "halton:hood": Component("halton:hood", "Halton", category="hood", verified=False),
        })
        project = Project(
            components=(
                Instance("equip-02", "halton:hood", Transform(Point(2000, 1000, 2500))),
                Instance("equip-01", "angelo-po:generic", Transform(Point(1000, 1000, 0), 90), {"power_kw": 12}),
            ),
            networks=(Network("exhaust", "exhaust", (
                Segment("s1", (Point(1500,1500,2800), Point(3000,1500,2800)), 315, 1200),
            )),),
        )
        return project, catalog

    def test_deterministic_and_schema(self):
        p, c = self.make_project()
        a = export_cad_document(p, c).canonical_json()
        self.assertEqual(a, export_cad_document(p, c).canonical_json())
        self.assertEqual(json.loads(a)["schema"], SCHEMA)

    def test_ids_network_and_rotation(self):
        p, c = self.make_project()
        d = export_cad_document(p, c)
        self.assertEqual([x.instance_id for x in d.blocks], ["equip-01", "equip-02"])
        self.assertEqual(d.curves[0].curve_id, "exhaust:s1")
        self.assertEqual(d.blocks[0].rotation_z_deg, 90)

    def test_unverified_is_warning(self):
        p, c = self.make_project()
        d = export_cad_document(p, c)
        self.assertIn("UNVERIFIED_CATALOG_COMPONENT:equip-02:halton:hood", d.warnings)
        self.assertFalse(d.blocks[1].metadata["verified"])

    def test_unknown_catalog_rejected(self):
        p, c = self.make_project()
        p.components = p.components + (Instance("bad", "missing", Transform(Point(0,0,0))),)
        with self.assertRaises(CadExportError): export_cad_document(p, c)

    def test_units_normalized_to_mm(self):
        p, c = self.make_project()
        p.units = "cm"
        d = export_cad_document(p, c)
        self.assertEqual(d.blocks[0].origin_mm, (20000.0, 10000.0, 25000.0))

    def test_roundtrip(self):
        p, c = self.make_project()
        d = export_cad_document(p, c)
        path = ROOT / "tests" / "python" / ".cad-roundtrip.json"
        try:
            d.write(path)
            self.assertEqual(d.canonical_json(), load_cad_json(path).canonical_json())
        finally:
            path.unlink(missing_ok=True)

if __name__ == "__main__":
    unittest.main()
