"""RhinoPython projection adapter for mpkd-cad/v1."""
import json

SCHEMA = "mpkd-cad/v1"
INSTANCE_KEY = "MPKD_INSTANCE_ID"
CATALOG_KEY = "MPKD_CATALOG_ID"

def _user_text(obj, key):
    return obj.Attributes.GetUserString(key)

def _set_user_text(obj, key, value):
    obj.Attributes.SetUserString(key, "" if value is None else str(value))

def find_mpkd_objects(doc):
    result = {}
    for obj in doc.Objects:
        instance_id = _user_text(obj, INSTANCE_KEY)
        if instance_id:
            result[instance_id] = obj
    return result

def ensure_layer(doc, name):
    index = doc.Layers.FindByFullPath(name, -1)
    return index if index >= 0 else doc.Layers.Add(name, None)

def apply_document(doc, cad_document, block_factory):
    if cad_document.get("schema") != SCHEMA:
        raise ValueError("Unsupported CAD schema")
    existing = find_mpkd_objects(doc)
    seen, updated, created, errors = set(), [], [], []
    for block in cad_document.get("blocks", []):
        instance_id = block["instance_id"]
        seen.add(instance_id)
        ensure_layer(doc, block["layer"])
        try:
            current = existing.get(instance_id)
            obj = block_factory(doc, block, current)
            if obj is None:
                raise RuntimeError("block_factory returned None")
            _set_user_text(obj, INSTANCE_KEY, instance_id)
            _set_user_text(obj, CATALOG_KEY, block["catalog_id"])
            for key, value in block.get("metadata", {}).items():
                _set_user_text(obj, "MPKD_" + key.upper(), value)
            (updated if current is not None else created).append(instance_id)
        except Exception as exc:
            errors.append(f"{instance_id}: {exc}")
    return {
        "updated": sorted(updated),
        "created": sorted(created),
        "orphans": sorted(set(existing) - seen),
        "errors": errors,
    }

def load(path):
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if data.get("schema") != SCHEMA:
        raise ValueError("Unsupported CAD schema")
    return data
