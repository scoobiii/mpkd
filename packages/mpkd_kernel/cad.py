"""Deterministic MPKD <-> CAD interoperability contract."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass
import json
from pathlib import Path
from typing import Any, Iterable, Mapping, Protocol

SCHEMA = "mpkd-cad/v1"
SUPPORTED_UNITS = {"mm", "cm", "m"}
_UNIT_TO_MM = {"mm": 1.0, "cm": 10.0, "m": 1000.0}

LAYERS = (
    "MPKD::00_REFERENCE",
    "MPKD::01_ARCHITECTURE",
    "MPKD::02_EQUIPMENT",
    "MPKD::02_EQUIPMENT::ANGELO_PO",
    "MPKD::02_EQUIPMENT::HALTON",
    "MPKD::02_EQUIPMENT::OTHER_MANUFACTURERS",
    "MPKD::03_HVAC_R",
    "MPKD::03_HVAC_R::EXHAUST",
    "MPKD::03_HVAC_R::SUPPLY_AIR",
    "MPKD::03_HVAC_R::REFRIGERANT",
    "MPKD::04_HYDRAULIC",
    "MPKD::04_HYDRAULIC::WATER_COLD",
    "MPKD::04_HYDRAULIC::WATER_HOT",
    "MPKD::04_HYDRAULIC::DRAIN",
    "MPKD::05_ELECTRICAL",
    "MPKD::06_CLEARANCES",
    "MPKD::07_WARNINGS",
    "MPKD::08_DOCUMENTATION",
)


class CadExportError(ValueError):
    pass


@dataclass(frozen=True)
class CadBlock:
    instance_id: str
    catalog_id: str
    layer: str
    origin_mm: tuple[float, float, float]
    rotation_z_deg: float = 0.0
    parameters: dict[str, float | str | bool] = field(default_factory=dict)
    metadata: dict[str, str | bool | float | int | None] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "instance_id": self.instance_id,
            "catalog_id": self.catalog_id,
            "layer": self.layer,
            "origin_mm": list(self.origin_mm),
            "rotation_z_deg": self.rotation_z_deg,
            "parameters": _sorted_mapping(self.parameters),
            "metadata": _sorted_mapping(self.metadata),
        }


@dataclass(frozen=True)
class CadCurve:
    curve_id: str
    utility: str
    points_mm: tuple[tuple[float, float, float], ...]
    diameter_mm: float | None = None
    metadata: dict[str, str | bool | float | int | None] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "curve_id": self.curve_id,
            "utility": self.utility,
            "points_mm": [list(point) for point in self.points_mm],
            "diameter_mm": self.diameter_mm,
            "metadata": _sorted_mapping(self.metadata),
        }


@dataclass(frozen=True)
class CadDocument:
    schema: str
    project_id: str
    project_version: int
    units: str
    blocks: tuple[CadBlock, ...] = ()
    curves: tuple[CadCurve, ...] = ()
    layers: tuple[str, ...] = LAYERS
    warnings: tuple[str, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": self.schema,
            "project_id": self.project_id,
            "project_version": self.project_version,
            "units": self.units,
            "layers": list(self.layers),
            "blocks": [x.to_dict() for x in self.blocks],
            "curves": [x.to_dict() for x in self.curves],
            "warnings": list(self.warnings),
        }

    def canonical_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, sort_keys=True, separators=(",", ":"))

    def write(self, path: str | Path) -> None:
        Path(path).write_text(self.canonical_json() + "\n", encoding="utf-8")


class CatalogLike(Protocol):
    components: Mapping[str, Any]


def _sorted_mapping(value: Mapping[str, Any]) -> dict[str, Any]:
    return {key: _jsonable(value[key]) for key in sorted(value)}


def _jsonable(value: Any) -> Any:
    if is_dataclass(value):
        return {key: _jsonable(item) for key, item in asdict(value).items()}
    if isinstance(value, Mapping):
        return {str(k): _jsonable(v) for k, v in sorted(value.items(), key=lambda item: str(item[0]))}
    if isinstance(value, (list, tuple)):
        return [_jsonable(item) for item in value]
    if hasattr(value, "__dict__") and not isinstance(value, type):
        return {k: _jsonable(v) for k, v in sorted(vars(value).items()) if not k.startswith("_")}
    return value


def _attr(obj: Any, name: str, default: Any = None) -> Any:
    if isinstance(obj, Mapping):
        return obj.get(name, default)
    return getattr(obj, name, default)


def _xyz(value: Any, factor: float = 1.0) -> tuple[float, float, float]:
    return (
        float(_attr(value, "x", 0.0)) * factor,
        float(_attr(value, "y", 0.0)) * factor,
        float(_attr(value, "z", 0.0)) * factor,
    )


def _catalog_get(catalog: Any, component_id: str) -> Any:
    components = _attr(catalog, "components", None)
    if isinstance(components, Mapping) and component_id in components:
        return components[component_id]
    getter = getattr(catalog, "get", None)
    if getter:
        try:
            return getter(component_id)
        except (KeyError, ValueError):
            return None
    return None


def _layer_for_component(component: Any) -> str:
    manufacturer = str(_attr(component, "manufacturer", "OTHER_MANUFACTURERS")).upper()
    if "ANGELO PO" in manufacturer or "ANGELO_PO" in manufacturer:
        suffix = "ANGELO_PO"
    elif "HALTON" in manufacturer:
        suffix = "HALTON"
    else:
        suffix = "OTHER_MANUFACTURERS"
    return f"MPKD::02_EQUIPMENT::{suffix}"


def _origin(instance: Any, factor: float) -> tuple[float, float, float]:
    transform = _attr(instance, "transform")
    origin = _attr(transform, "origin") if transform is not None else None
    if origin is None:
        origin = _attr(instance, "origin")
    return _xyz(origin or {"x": 0, "y": 0, "z": 0}, factor)


def _rotation(instance: Any) -> float:
    transform = _attr(instance, "transform")
    if transform is not None:
        value = _attr(transform, "rotation_z_deg", _attr(transform, "rotation_z", 0.0))
    else:
        value = _attr(instance, "rotation_z_deg", 0.0)
    return float(value or 0.0)


def _parameters(instance: Any, component: Any) -> dict[str, Any]:
    result = dict(_attr(instance, "parameters", {}) or {})
    dimensions = _attr(component, "dimensions_mm")
    if dimensions is not None and len(dimensions) == 3:
        result.update(width_mm=dimensions[0], depth_mm=dimensions[1], height_mm=dimensions[2])
    clearance = _attr(component, "maintenance_clearance_mm")
    if clearance is not None:
        result["maintenance_clearance_mm"] = clearance
    return result


def _metadata(instance: Any, component: Any) -> dict[str, Any]:
    return {
        "manufacturer": _attr(component, "manufacturer"),
        "model": _attr(component, "model"),
        "category": _attr(component, "category"),
        "source_ref": _attr(component, "source_ref"),
        "verified": bool(_attr(component, "verified", False)),
        "mpkd_instance_id": _attr(instance, "instance_id", _attr(instance, "id")),
        "catalog_id": _attr(instance, "component_id", _attr(instance, "catalog_id")),
    }


def _network_points(segment: Any, factor: float) -> tuple[tuple[float, float, float], ...]:
    raw = _attr(segment, "points", _attr(segment, "polyline"))
    if raw:
        return tuple(_xyz(point, factor) for point in raw)
    start = _attr(segment, "start", _attr(segment, "from_point"))
    end = _attr(segment, "end", _attr(segment, "to_point"))
    if start is not None and end is not None:
        return (_xyz(start, factor), _xyz(end, factor))
    return ()


def _export_segments(network: Any, factor: float) -> list[CadCurve]:
    network_id = str(_attr(network, "network_id", _attr(network, "id", "network")))
    utility = str(_attr(network, "utility", _attr(network, "utility_type", "unknown")))
    curves = []
    for segment in _attr(network, "segments", ()):
        segment_id = str(_attr(segment, "segment_id", _attr(segment, "id", "segment")))
        points = _network_points(segment, factor)
        if len(points) < 2:
            raise CadExportError(f"Segmento de rede sem geometria válida: {network_id}/{segment_id}")
        diameter = _attr(segment, "diameter_mm")
        curves.append(CadCurve(
            curve_id=f"{network_id}:{segment_id}",
            utility=str(_attr(segment, "utility", utility)),
            points_mm=points,
            diameter_mm=float(diameter) if diameter is not None else None,
            metadata={
                "network_id": network_id,
                "segment_id": segment_id,
                "flow_rate_m3_h": _attr(segment, "flow_rate_m3_h"),
            },
        ))
    return curves


def validate_cad_document(document: CadDocument) -> list[str]:
    errors = []
    if document.schema != SCHEMA:
        errors.append(f"schema inválido: {document.schema}")
    if document.units not in SUPPORTED_UNITS:
        errors.append(f"unidade inválida: {document.units}")
    if not document.project_id:
        errors.append("project_id vazio")
    if document.project_version < 1:
        errors.append("project_version inválida")
    if len(document.layers) != len(set(document.layers)):
        errors.append("layer duplicada")
    block_ids = [x.instance_id for x in document.blocks]
    if len(block_ids) != len(set(block_ids)):
        errors.append("instance_id duplicado")
    curve_ids = [x.curve_id for x in document.curves]
    if len(curve_ids) != len(set(curve_ids)):
        errors.append("curve_id duplicado")
    for block in document.blocks:
        if not block.instance_id or not block.catalog_id or not block.layer:
            errors.append("block sem instance_id/catalog_id/layer")
    for curve in document.curves:
        if len(curve.points_mm) < 2:
            errors.append(f"curve sem dois pontos: {curve.curve_id}")
        if curve.diameter_mm is not None and curve.diameter_mm <= 0:
            errors.append(f"diâmetro inválido: {curve.curve_id}")
    return errors


def export_cad_document(project: Any, catalog: CatalogLike, *, validation_issues: Iterable[Any] | None = None) -> CadDocument:
    project_id = str(_attr(project, "project_id", _attr(project, "id", "")))
    if not project_id:
        raise CadExportError("Projeto sem project_id")
    version = int(_attr(project, "version", 1))
    units = str(_attr(project, "units", "mm"))
    if units not in SUPPORTED_UNITS:
        raise CadExportError(f"Unidade não suportada pelo contrato: {units}")
    factor = _UNIT_TO_MM[units]

    blocks = []
    warnings = []
    components = _attr(project, "components", ())
    if isinstance(components, Mapping):
        components = components.values()

    for instance in sorted(components, key=lambda x: str(_attr(x, "instance_id", _attr(x, "id", "")))):
        instance_id = str(_attr(instance, "instance_id", _attr(instance, "id", "")))
        catalog_id = str(_attr(instance, "component_id", _attr(instance, "catalog_id", "")))
        if not instance_id or not catalog_id:
            raise CadExportError("Componente sem instance_id ou catalog_id")
        component = _catalog_get(catalog, catalog_id)
        if component is None:
            raise CadExportError(f"Componente desconhecido no catálogo: {catalog_id}")
        if not bool(_attr(component, "verified", False)):
            warnings.append(f"UNVERIFIED_CATALOG_COMPONENT:{instance_id}:{catalog_id}")
        blocks.append(CadBlock(
            instance_id=instance_id,
            catalog_id=catalog_id,
            layer=_layer_for_component(component),
            origin_mm=_origin(instance, factor),
            rotation_z_deg=_rotation(instance),
            parameters=_parameters(instance, component),
            metadata=_metadata(instance, component),
        ))

    networks = _attr(project, "networks", ())
    if isinstance(networks, Mapping):
        networks = networks.values()
    curves = []
    for network in sorted(networks, key=lambda x: str(_attr(x, "network_id", _attr(x, "id", "")))):
        curves.extend(_export_segments(network, factor))

    if validation_issues:
        for issue in validation_issues:
            severity = str(_attr(issue, "severity", "warning"))
            code = str(_attr(issue, "code", "UNKNOWN"))
            if severity in {"blocker", "error", "fatal"}:
                warnings.append(f"VALIDATION_{severity.upper()}:{code}")

    document = CadDocument(
        schema=SCHEMA,
        project_id=project_id,
        project_version=version,
        units=units,
        blocks=tuple(blocks),
        curves=tuple(sorted(curves, key=lambda x: x.curve_id)),
        warnings=tuple(sorted(set(warnings))),
    )
    errors = validate_cad_document(document)
    if errors:
        raise CadExportError("; ".join(errors))
    return document


def export_cad_json(project: Any, catalog: CatalogLike, path: str | Path, *, validation_issues: Iterable[Any] | None = None) -> CadDocument:
    document = export_cad_document(project, catalog, validation_issues=validation_issues)
    document.write(path)
    return document


def load_cad_json(path: str | Path) -> CadDocument:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if payload.get("schema") != SCHEMA:
        raise CadExportError(f"schema inválido: {payload.get('schema')}")
    document = CadDocument(
        schema=payload["schema"],
        project_id=payload["project_id"],
        project_version=int(payload["project_version"]),
        units=payload["units"],
        layers=tuple(payload.get("layers", LAYERS)),
        blocks=tuple(CadBlock(
            instance_id=x["instance_id"],
            catalog_id=x["catalog_id"],
            layer=x["layer"],
            origin_mm=tuple(float(v) for v in x["origin_mm"]),
            rotation_z_deg=float(x.get("rotation_z_deg", 0.0)),
            parameters=dict(x.get("parameters", {})),
            metadata=dict(x.get("metadata", {})),
        ) for x in payload.get("blocks", [])),
        curves=tuple(CadCurve(
            curve_id=x["curve_id"],
            utility=x["utility"],
            points_mm=tuple(tuple(float(v) for v in p) for p in x["points_mm"]),
            diameter_mm=float(x["diameter_mm"]) if x.get("diameter_mm") is not None else None,
            metadata=dict(x.get("metadata", {})),
        ) for x in payload.get("curves", [])),
        warnings=tuple(payload.get("warnings", [])),
    )
    errors = validate_cad_document(document)
    if errors:
        raise CadExportError("; ".join(errors))
    return document
