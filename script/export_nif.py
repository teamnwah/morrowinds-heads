#!/usr/bin/env python3
import os
import sys

from pyffi.formats.nif import NifFormat
import json


def export(path):
    data = NifFormat.Data()
    with open(path, 'rb') as f:
        data.inspect(f)
        data.read(f)

    objects = []
    for root in data.roots:
        name = root.name.decode('utf-8').lower()
        # For this project, only hair and head matters
        if 'hair' in name or 'head' in name:
            sys.stderr.write("> " + name + "\n")
        else:
            sys.stderr.write("  " + name + "\n")
            continue

        if isinstance(root, NifFormat.NiNode):
            objects.append(export_object(root))

        # Some NiTriShape's are a root object
        if isinstance(root, NifFormat.NiTriShape):
            objects.append({'name': root.name.decode('utf-8'), 'shapes': [export_shape(root)]})

    return objects


def export_object(root: NifFormat.NiNode):
    obj = {'name': root.name.decode("utf-8"), 'shapes': []}

    for shape in root.get_children():
        if not isinstance(shape, NifFormat.NiTriShape):
            continue

        obj['shapes'].append(export_shape(shape))

    return obj


def export_shape(shape: NifFormat.NiTriShape):
    vertices = [(vertice.x, vertice.y, vertice.z) for vertice in list(shape.data.vertices)]
    faces = shape.data.get_triangles()
    uv_sets = [[[coord.u, coord.v] for coord in uv_set] for uv_set in shape.data.uv_sets]
    normals = [(vertice.x, vertice.y, vertice.z) for vertice in list(shape.data.normals)]
    texture = None

    for property in shape.get_properties():
        if isinstance(property, NifFormat.NiTexturingProperty):
            texture = export_texture(property.base_texture)

    return {
        'name': shape.name.decode("utf-8"),
        'vertices': vertices,
        'faces': faces,
        'uvSets': uv_sets,
        'normals': normals,
        'texture': texture,
        'translation': (shape.translation.x, shape.translation.y, shape.translation.z),
        'rotation': shape.rotation.as_list(),
    }


def export_texture(texture):
    wrap_s = texture.clamp_mode in [2, 3]
    wrap_t = texture.clamp_mode in [1, 3]
    source = texture.source

    return {
        'wrapS': wrap_s,
        'wrapT': wrap_t,
        'uvSet': texture.uv_set,
        'file': source.file_name.decode("utf-8")
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <dir>")
        exit(1)

    objects = []
    for item in os.scandir(sys.argv[1]):
        if item.is_file():
            objects.extend(export(item.path))

    print(json.dumps(objects))