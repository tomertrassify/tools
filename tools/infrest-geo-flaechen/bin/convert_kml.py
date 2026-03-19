#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from osgeo import ogr, osr
from shapely import wkb
from shapely.geometry import (
    GeometryCollection,
    LineString,
    MultiPoint,
    Point,
    Polygon,
    box,
    mapping,
)
from shapely.ops import nearest_points, transform, triangulate, unary_union
from shapely.strtree import STRtree
from shapely.validation import make_valid


MAX_AREA_M2 = 1_500_000.0
MAX_PERIMETER_M = 12_000.0
CONNECTOR_WIDTH_M = 0.001
AREA_EPSILON = 1e-6
EDGE_EPSILON = 1e-7


@dataclass
class FragmentGroup:
    seed_index: int
    indices: set[int]
    area: float
    frontier: set[int]
    seed_axis: float


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip()).strip("-").lower()
    return slug or "konvertiert"


def drop_z(geometry):
    return transform(lambda x, y, z=None: (x, y), geometry)


def iter_polygon_parts(geometry) -> Iterable[Polygon]:
    if geometry is None or geometry.is_empty:
        return

    valid = make_valid(geometry)
    if valid.is_empty:
        return

    if valid.geom_type == "Polygon":
        yield valid
        return

    if hasattr(valid, "geoms"):
        for sub_geometry in valid.geoms:
            yield from iter_polygon_parts(sub_geometry)


def collect_wgs84_polygons(input_path: Path) -> list[Polygon]:
    ogr.UseExceptions()
    dataset = ogr.Open(str(input_path))
    if dataset is None:
        raise RuntimeError("Die KML-Datei konnte nicht gelesen werden.")

    polygons: list[Polygon] = []
    for layer_index in range(dataset.GetLayerCount()):
        layer = dataset.GetLayerByIndex(layer_index)
        if layer is None:
            continue

        layer.ResetReading()
        for feature in layer:
            geometry = feature.GetGeometryRef()
            if geometry is None:
                continue

            shapely_geometry = drop_z(wkb.loads(bytes(geometry.ExportToWkb())))
            for polygon in iter_polygon_parts(shapely_geometry):
                if polygon.area > AREA_EPSILON:
                    polygons.append(polygon)

    if not polygons:
        raise RuntimeError("Die KML enthält keine Polygon-Geometrie.")

    return polygons


def apply_axis_mapping(spatial_reference) -> None:
    spatial_reference.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)


def choose_metric_srs(wgs84_geometry):
    point = wgs84_geometry.representative_point()
    lon = point.x
    lat = point.y

    spatial_reference = osr.SpatialReference()
    apply_axis_mapping(spatial_reference)

    if -80.0 <= lat <= 84.0:
        zone = int(math.floor((lon + 180.0) / 6.0) + 1)
        zone = min(max(zone, 1), 60)
        epsg = 32600 + zone if lat >= 0 else 32700 + zone
        spatial_reference.ImportFromEPSG(epsg)
        return spatial_reference

    proj4 = (
        f"+proj=laea +lat_0={lat:.8f} +lon_0={lon:.8f} "
        "+datum=WGS84 +units=m +no_defs"
    )
    spatial_reference.ImportFromProj4(proj4)
    return spatial_reference


def make_transformer(coordinate_transformation):
    def _transform(x, y, z=None):
        if hasattr(x, "__iter__"):
            transformed = [coordinate_transformation.TransformPoint(float(x_value), float(y_value)) for x_value, y_value in zip(x, y)]
            return [value[0] for value in transformed], [value[1] for value in transformed]

        transformed_x, transformed_y, _ = coordinate_transformation.TransformPoint(float(x), float(y))
        return transformed_x, transformed_y

    return _transform


def metric_transformers(wgs84_geometry):
    source_srs = osr.SpatialReference()
    source_srs.ImportFromEPSG(4326)
    apply_axis_mapping(source_srs)

    metric_srs = choose_metric_srs(wgs84_geometry)
    to_metric = make_transformer(osr.CoordinateTransformation(source_srs, metric_srs))
    to_wgs84 = make_transformer(osr.CoordinateTransformation(metric_srs, source_srs))
    return to_metric, to_wgs84


def polygon_union(polygons: Iterable[Polygon]):
    polygon_list = [polygon for polygon in polygons if polygon.area > AREA_EPSILON]
    if not polygon_list:
        raise RuntimeError("Es konnte keine gültige Polygon-Geometrie erzeugt werden.")
    return unary_union(polygon_list)


def geometry_union(geometries):
    geometry_list = [geometry for geometry in geometries if geometry is not None and not geometry.is_empty]
    if not geometry_list:
        raise RuntimeError("Es konnte keine gültige Polygon-Geometrie erzeugt werden.")
    return unary_union(geometry_list)


def build_connector(start_point: Point, end_point: Point) -> Polygon:
    if start_point.equals(end_point):
        return start_point.buffer(CONNECTOR_WIDTH_M / 2.0)

    connector_line = LineString([start_point.coords[0], end_point.coords[0]])
    return connector_line.buffer(CONNECTOR_WIDTH_M / 2.0)


def merge_connected_parts(parts: list[Polygon], connectors: list[Polygon]) -> Polygon | None:
    merged = geometry_union([*parts, *connectors] if connectors else parts)
    merged_parts = [polygon for polygon in iter_polygon_parts(merged) if polygon.area > AREA_EPSILON]
    if len(merged_parts) == 1:
        return merged_parts[0]
    return None


def connect_polygon_components(geometry) -> Polygon:
    parts = [polygon for polygon in iter_polygon_parts(geometry) if polygon.area > AREA_EPSILON]
    if not parts:
        raise RuntimeError("Es konnte keine Polygon-Geometrie erzeugt werden.")

    if len(parts) == 1:
        return parts[0]

    parts.sort(key=lambda polygon: polygon.area, reverse=True)
    connectors: list[Polygon] = []
    connected = {0}
    remaining = set(range(1, len(parts)))

    while remaining:
        best_match = None
        for connected_index in connected:
            for remaining_index in remaining:
                start_point, end_point = nearest_points(parts[connected_index], parts[remaining_index])
                distance = start_point.distance(end_point)
                if best_match is None or distance < best_match[0]:
                    best_match = (distance, remaining_index, start_point, end_point)

        if best_match is None:
            break

        _, remaining_index, start_point, end_point = best_match
        connectors.append(build_connector(start_point, end_point))
        connected.add(remaining_index)
        remaining.remove(remaining_index)

    connected_polygon = merge_connected_parts(parts, connectors)
    if connected_polygon is not None:
        return connected_polygon

    fallback_connectors = [
        build_connector(*nearest_points(parts[0], part))
        for part in parts[1:]
    ]
    connected_polygon = merge_connected_parts(parts, fallback_connectors)
    if connected_polygon is not None:
        return connected_polygon

    raise RuntimeError("Die Flächen konnten nicht zu einem einzelnen Polygon verbunden werden.")


def outer_perimeter(geometry: Polygon) -> float:
    return geometry.exterior.length


def needs_split(geometry: Polygon) -> bool:
    return geometry.area > MAX_AREA_M2 or outer_perimeter(geometry) > MAX_PERIMETER_M


def minimum_part_count(geometry: Polygon) -> int:
    area_parts = math.ceil(geometry.area / MAX_AREA_M2)
    perimeter_parts = math.ceil(outer_perimeter(geometry) / MAX_PERIMETER_M)
    return max(1, area_parts, perimeter_parts)


def format_split_context(geometry: Polygon) -> str:
    hole_count = len(geometry.interiors)
    return (
        f"Ausgangsfläche: {geometry.area:.3f} m², "
        f"Außenumfang: {outer_perimeter(geometry):.3f} m, "
        f"Löcher: {hole_count}, "
        f"mindestens benötigte Teile: {minimum_part_count(geometry)}."
    )


def axis_values(geometry: Polygon, fragments: list[Polygon]) -> tuple[list[float], float]:
    min_x, min_y, max_x, max_y = geometry.bounds
    use_x_axis = (max_x - min_x) >= (max_y - min_y)
    values = [
        (fragment.representative_point().x if use_x_axis else fragment.representative_point().y)
        for fragment in fragments
    ]
    span = max(values) - min(values) if values else 1.0
    return values, span if span > 0 else 1.0


def preferred_axes(geometry: Polygon) -> list[str]:
    min_x, min_y, max_x, max_y = geometry.bounds
    if (max_x - min_x) >= (max_y - min_y):
        return ["x", "y"]
    return ["y", "x"]


def clip_polygon_range(geometry: Polygon, axis: str, start: float, end: float) -> Polygon:
    min_x, min_y, max_x, max_y = geometry.bounds
    margin = max(max_x - min_x, max_y - min_y, 1.0) + 1.0

    if axis == "x":
        clipping_box = box(start, min_y - margin, end, max_y + margin)
    else:
        clipping_box = box(min_x - margin, start, max_x + margin, end)

    polygon_parts = [
        polygon
        for polygon in iter_polygon_parts(geometry.intersection(clipping_box))
        if polygon.area > AREA_EPSILON
    ]
    if not polygon_parts:
        raise RuntimeError("Der Achsenschnitt hat keine gültige Teilfläche erzeugt.")

    return connect_polygon_components(polygon_union(polygon_parts))


def find_axis_cut(geometry: Polygon, axis: str, target_area: float) -> float:
    min_x, min_y, max_x, max_y = geometry.bounds
    lower = min_x if axis == "x" else min_y
    upper = max_x if axis == "x" else max_y

    for _ in range(60):
        midpoint = (lower + upper) / 2.0
        try:
            left_piece = clip_polygon_range(geometry, axis, -1e18, midpoint)
            left_area = left_piece.area
        except RuntimeError:
            left_area = 0.0

        if left_area < target_area:
            lower = midpoint
        else:
            upper = midpoint

    return (lower + upper) / 2.0


def strip_split_polygon(geometry: Polygon, part_count: int, axis: str) -> list[Polygon]:
    pieces: list[Polygon] = []
    remaining = geometry

    for remaining_parts in range(part_count, 1, -1):
        target_area = remaining.area / remaining_parts
        cut = find_axis_cut(remaining, axis, target_area)
        current_piece = clip_polygon_range(remaining, axis, -1e18, cut)
        remaining_piece = clip_polygon_range(remaining, axis, cut, 1e18)

        if current_piece.area <= AREA_EPSILON or remaining_piece.area <= AREA_EPSILON:
            raise RuntimeError("Der Achsenschnitt hat eine leere Teilfläche erzeugt.")

        pieces.append(current_piece)
        remaining = remaining_piece

    pieces.append(remaining)
    return pieces


def build_fragments(geometry: Polygon, part_count: int) -> list[Polygon]:
    min_x, min_y, max_x, max_y = geometry.bounds
    width = max(max_x - min_x, 1.0)
    height = max(max_y - min_y, 1.0)
    aspect = width / height if height > 0 else 1.0
    point_target = max(12, part_count * 12)

    for _ in range(6):
        columns = max(2, int(math.ceil(math.sqrt(point_target * aspect))))
        rows = max(2, int(math.ceil(point_target / columns)))
        step_x = width / (columns + 1)
        step_y = height / (rows + 1)

        points: list[Point] = []
        for row in range(1, rows + 1):
            y = min_y + row * step_y
            for column in range(1, columns + 1):
                x = min_x + column * step_x
                point = Point(x, y)
                if geometry.covers(point):
                    points.append(point)

        triangulation_seed = GeometryCollection([geometry, MultiPoint(points)])
        triangles = triangulate(triangulation_seed)
        fragments: list[Polygon] = []
        for triangle in triangles:
            clipped = geometry.intersection(triangle)
            for polygon in iter_polygon_parts(clipped):
                if polygon.area > AREA_EPSILON:
                    fragments.append(polygon)

        if len(fragments) >= max(part_count * 6, part_count + 2):
            return fragments

        point_target *= 2

    if not fragments:
        raise RuntimeError("Die Geometrie konnte nicht in Teilflächen zerlegt werden.")

    return fragments


def build_adjacency(fragments: list[Polygon]) -> list[set[int]]:
    tree = STRtree(fragments)
    adjacency: list[set[int]] = [set() for _ in fragments]

    for index, fragment in enumerate(fragments):
        candidates = tree.query(fragment)
        for candidate_index in candidates:
            candidate_index = int(candidate_index)
            if candidate_index <= index:
                continue

            candidate = fragments[candidate_index]
            if fragment.intersects(candidate) or fragment.distance(candidate) <= EDGE_EPSILON:
                adjacency[index].add(candidate_index)
                adjacency[candidate_index].add(index)

    return adjacency


def pick_seed_indices(values: list[float], part_count: int, shift_ratio: float = 0.0) -> list[int]:
    ordered = sorted(range(len(values)), key=lambda index: values[index])
    used: set[int] = set()
    seeds: list[int] = []

    for slot in range(part_count):
        preferred = ((slot + 0.5 + shift_ratio) / part_count) * len(ordered) - 0.5
        preferred_position = min(max(int(round(preferred)), 0), len(ordered) - 1)
        search_order = sorted(range(len(ordered)), key=lambda position: abs(position - preferred_position))

        for position in search_order:
            index = ordered[position]
            if index not in used:
                used.add(index)
                seeds.append(index)
                break

    return seeds


def cluster_fragments(geometry: Polygon, fragments: list[Polygon], adjacency: list[set[int]], part_count: int):
    if len(fragments) < part_count:
        raise RuntimeError("Es sind zu wenige Fragmente für die gewünschte Aufteilung vorhanden.")

    fragment_areas = [fragment.area for fragment in fragments]
    centroids = [fragment.representative_point() for fragment in fragments]
    values, axis_span = axis_values(geometry, fragments)
    min_x, min_y, max_x, max_y = geometry.bounds
    diagonal = math.hypot(max_x - min_x, max_y - min_y) or 1.0
    target_area = geometry.area / part_count

    for shift_ratio in (0.0, 0.22, -0.22, 0.35, -0.35):
        seed_indices = pick_seed_indices(values, part_count, shift_ratio)
        if len(seed_indices) < part_count:
            continue

        groups: list[FragmentGroup] = []
        unassigned = set(range(len(fragments)))
        for seed_index in seed_indices:
            unassigned.discard(seed_index)
            groups.append(
                FragmentGroup(
                    seed_index=seed_index,
                    indices={seed_index},
                    area=fragment_areas[seed_index],
                    frontier=set(),
                    seed_axis=values[seed_index],
                )
            )

        for group in groups:
            group.frontier = adjacency[group.seed_index] & unassigned

        while unassigned:
            expandable_groups = [group for group in groups if group.frontier]
            if not expandable_groups:
                break

            group = min(
                expandable_groups,
                key=lambda current: (current.area / target_area, len(current.indices), current.seed_axis),
            )

            def candidate_score(fragment_index: int) -> tuple[float, float, float]:
                projected_area = group.area + fragment_areas[fragment_index]
                overshoot = max(0.0, projected_area - target_area) / target_area
                balance = abs(projected_area - target_area) / target_area
                axis_offset = abs(values[fragment_index] - group.seed_axis) / axis_span
                seed_distance = centroids[group.seed_index].distance(centroids[fragment_index]) / diagonal
                return (
                    overshoot * 8.0 + balance * 4.0 + axis_offset + seed_distance,
                    balance,
                    seed_distance,
                )

            next_fragment = min(group.frontier, key=candidate_score)
            unassigned.remove(next_fragment)

            for current_group in groups:
                current_group.frontier.discard(next_fragment)

            group.indices.add(next_fragment)
            group.area += fragment_areas[next_fragment]
            group.frontier |= adjacency[next_fragment] & unassigned

        if unassigned:
            continue

        grouped_polygons: list[Polygon] = []
        for group in groups:
            group_geometry = polygon_union([fragments[index] for index in group.indices])
            try:
                grouped_polygon = connect_polygon_components(group_geometry)
            except RuntimeError:
                break
            grouped_polygons.append(grouped_polygon)

        if len(grouped_polygons) != part_count:
            continue

        grouped_polygons.sort(key=lambda polygon: polygon.representative_point().x + polygon.representative_point().y)
        return grouped_polygons

    raise RuntimeError("Die Geometrie konnte nicht stabil in zusammenhängende Teile aufgeteilt werden.")


def split_polygon(geometry: Polygon, part_count: int) -> list[Polygon]:
    for axis in preferred_axes(geometry):
        try:
            pieces = strip_split_polygon(geometry, part_count, axis)
            if len(pieces) == part_count:
                return pieces
        except RuntimeError:
            continue

    for _ in range(4):
        fragments = build_fragments(geometry, part_count)
        adjacency = build_adjacency(fragments)
        result = cluster_fragments(geometry, fragments, adjacency, part_count)
        if len(result) == part_count:
            return result

    raise RuntimeError("Die Geometrie konnte nicht in passende Teilflächen zerlegt werden.")


def convert_metric_polygon(metric_polygon: Polygon) -> list[Polygon]:
    if not needs_split(metric_polygon):
        return [metric_polygon]

    part_count = minimum_part_count(metric_polygon)
    max_parts = max(part_count * 8, 64)

    while part_count <= max_parts:
        parts = split_polygon(metric_polygon, part_count)
        if all(not needs_split(part) for part in parts):
            return parts
        part_count += 1

    raise RuntimeError("Die Geometrie konnte nicht innerhalb der Grenzwerte aufgeteilt werden.")


def write_geojson(output_path: Path, geometry_wgs84, part_index: int, total_parts: int, area_m2: float, perimeter_m: float):
    feature_collection = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "part_index": part_index,
                    "total_parts": total_parts,
                    "area_m2": round(area_m2, 3),
                    "perimeter_m": round(perimeter_m, 3),
                },
                "geometry": mapping(geometry_wgs84),
            }
        ],
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(feature_collection, handle, ensure_ascii=False, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--base-name", required=True)
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    polygons_wgs84 = collect_wgs84_polygons(input_path)
    merged_wgs84 = connect_polygon_components(polygon_union(polygons_wgs84))

    to_metric, to_wgs84 = metric_transformers(merged_wgs84)
    metric_polygon = connect_polygon_components(transform(to_metric, merged_wgs84))
    try:
        metric_parts = convert_metric_polygon(metric_polygon)
    except RuntimeError as exc:
        raise RuntimeError(f"{exc} {format_split_context(metric_polygon)}") from exc

    file_manifest = []
    base_name = slugify(args.base_name)
    total_parts = len(metric_parts)

    for index, metric_part in enumerate(metric_parts, start=1):
        part_wgs84 = transform(to_wgs84, metric_part)
        area_m2 = metric_part.area
        perimeter_m = outer_perimeter(metric_part)
        if total_parts == 1:
            filename = f"{base_name}.geojson"
        else:
            filename = f"{base_name}-teil-{index:02d}.geojson"

        output_path = output_dir / filename
        write_geojson(output_path, part_wgs84, index, total_parts, area_m2, perimeter_m)
        file_manifest.append(
            {
                "filename": filename,
                "path": str(output_path),
                "area_m2": round(area_m2, 3),
                "perimeter_m": round(perimeter_m, 3),
            }
        )

    result = {
        "parts": file_manifest,
        "total_parts": total_parts,
        "source_area_m2": round(metric_polygon.area, 3),
        "source_perimeter_m": round(outer_perimeter(metric_polygon), 3),
    }
    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        sys.stderr.write(f"{exc}\n")
        raise SystemExit(1)
