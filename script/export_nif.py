#!/usr/bin/env python3
import os
import sys
from os import DirEntry
from typing import List, Tuple, Optional, Dict

from pyffi.formats.nif import NifFormat
from PIL import Image
import json


class Texture:
    file: str
    wrap_s: bool
    wrap_t: bool
    uv_set: int

    def __init__(self, file: str, wrap_s: bool = True, wrap_t: bool = True, uv_set: int = 0):
        self.file = file
        self.wrap_s = wrap_s
        self.wrap_t = wrap_t
        self.uv_set = uv_set

    def __dict__(self):
        return {
            'file': self.file,
            'wrapS': self.wrap_s,
            'wrapT': self.wrap_t,
            'uvSet': self.uv_set,
        }


class Shape:
    name: str
    vertices: List[Tuple[float, float, float]]
    normals: List[Tuple[float, float, float]]
    faces: List[Tuple[float, float, float]]
    uv_sets: List[List[float]]
    translation: Tuple[float, float, float]
    rotation: List[Tuple[float, float, float]]
    texture: Optional[Texture]

    def __init__(self, name: str = ""):
        self.name = name
        self.texture = None

    def __dict__(self):
        return {
            'name': self.name,
            'vertices': self.vertices,
            'normals': self.normals,
            'faces': self.faces,
            'uvSets': self.uv_sets,
            'translation': self.translation,
            'rotation': self.rotation,
            'texture': self.texture.__dict__(),
        }


class ShapeCollection:
    name: str
    shapes: List[Shape]

    def __init__(self, name: str = ""):
        self.name = name
        self.shapes = []

    def __dict__(self):
        return {
            'name': self.name,
            'shapes': [s.__dict__() for s in self.shapes],
        }


def export(path) -> List[ShapeCollection]:
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
            coll = ShapeCollection(name)
            coll.shapes = [export_shape(root)]

            objects.append(coll)

    return objects


def export_object(root: NifFormat.NiNode) -> List[ShapeCollection]:
    obj = ShapeCollection(root.name.decode('utf-8'))

    for shape in root.tree():
        if not isinstance(shape, NifFormat.NiTriShape):
            continue

        obj.shapes.append(export_shape(shape))

    return obj


def export_shape(shape: NifFormat.NiTriShape) -> Shape:
    vertices = [(vertice.x, vertice.y, vertice.z) for vertice in list(shape.data.vertices)]
    faces = shape.data.get_triangles()
    uv_sets = [[(coord.u, coord.v) for coord in uv_set] for uv_set in shape.data.uv_sets]
    normals = [(vertice.x, vertice.y, vertice.z) for vertice in list(shape.data.normals)]

    res_shape = Shape()
    for property in shape.get_properties():
        if isinstance(property, NifFormat.NiTexturingProperty):
            res_shape.texture = export_texture(property.base_texture)

    res_shape.name = shape.name.decode('utf-8')
    res_shape.vertices = vertices
    res_shape.faces = faces
    res_shape.uv_sets = uv_sets
    res_shape.normals = normals
    res_shape.translation = (shape.translation.x, shape.translation.y, shape.translation.z)
    res_shape.rotation = shape.rotation.as_list()

    return res_shape


def export_texture(texture) -> Texture:
    wrap_s = texture.clamp_mode in [2, 3]
    wrap_t = texture.clamp_mode in [1, 3]
    source = texture.source

    return Texture(source.file_name.decode('utf-8'), wrap_s, wrap_t, texture.uv_set)


# Dumb file map allowing case-insensitive matching
# And Morrowind's fucky file resolving
class TextureMap:
    path: str
    files: Dict[str, DirEntry]
    dds_used: int
    original_dds: int
    original_used: int

    def __init__(self, path):
        self.path = path
        self.files = {}
        self.dds_used = 0
        self.original_dds = 0
        self.original_used = 0

    def build(self):
        for item in os.scandir(self.path):
            self.files[item.name.lower()] = item

    def get(self, name):
        lower_name = name.lower()
        dds_instead = lower_name.rsplit('.', maxsplit=1)[0] + '.dds'

        if dds_instead in self.files:
            if dds_instead == lower_name:
                self.original_dds += 1
            else:
                self.dds_used += 1
            return self.files[dds_instead].path

        self.original_used += 1
        return self.files[lower_name].path


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <nif dir> <texture dir> <output dir>")
        exit(1)

    nif_dir = sys.argv[1]
    texture_dir = sys.argv[2]
    texture_dir_map = TextureMap(texture_dir)
    texture_dir_map.build()

    output_dir = sys.argv[3]

    output_texture_dir = os.path.join(output_dir, 'texture')
    os.makedirs(output_texture_dir, exist_ok=True)

    output_mesh_file = os.path.join(output_dir, 'meshes.json')

    shape_colls = []

    for item in os.scandir(nif_dir):
        if not item.is_file():
            continue
        file_objects = export(item.path)

        for file_object in file_objects:
            file_object.name = file_object.name.lower()

            for shape in file_object.shapes:
                if shape.texture is not None:
                    new_texture_name = shape.texture.file.rsplit('.', maxsplit=1)[0] + '.png'
                    new_texture_name = new_texture_name.lower()
                    new_file_name = os.path.join(output_texture_dir, new_texture_name)

                    texture_image = Image.open(texture_dir_map.get(shape.texture.file))
                    texture_image.save(new_file_name, 'png')
                    shape.texture.file = new_texture_name

            shape_colls.append(file_object.__dict__())

    with open(output_mesh_file, 'w') as j:
        json.dump(shape_colls, j)

    print(f"Textures: {texture_dir_map.original_dds} Orig. DDS, {texture_dir_map.dds_used} New DDS, {texture_dir_map.original_used} Orig. Non-DDS")


if __name__ == '__main__':
    main()
