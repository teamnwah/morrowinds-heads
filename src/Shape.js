import {
    Face3,
    Geometry, Matrix4,
    Mesh, MeshPhongMaterial,
    RepeatWrapping,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three'
import {uuidv4} from "./util";
import {TGALoader} from "three/examples/jsm/loaders/TGALoader";
import {DDSLoader} from "three/examples/jsm/loaders/DDSLoader";

export class Shape {
    constructor({
                    vertices = [],
                    faces = [],
                    texture = null,
                    uvSets = [],
                    normals = [],
                    translation = [0, 0, 0],
                    rotation
                } = {}, filePrefix = "") {
        this.id = uuidv4();

        this.vertices = vertices;
        this.translation = translation;
        this.rotation = rotation;
        this.faces = faces;
        this.textureInfo = texture;
        this.normals = normals;
        this.uvSets = uvSets;

        this.filePrefix = filePrefix;

        this.geometry = null;
        this.mesh = null;
        this.texture = null;
        this.material = null;

    }

    getMaterial() {
        if (this.material) {
            return this.material;
        }

        const params = {
            color: 0xffffff,
            transparent: true,
            alphaTest: 0.2,
        };
        if (this.textureInfo) {
            let Loader;

            if (this.textureInfo.file.toLowerCase().endsWith('.tga')) {
                Loader = TGALoader
            } else if (this.textureInfo.file.toLowerCase().endsWith('.dds')) {
                Loader = DDSLoader
            } else {
                Loader = TextureLoader
            }

            this.texture = new Loader().load(this.filePrefix + this.textureInfo.file, () => {
            }, null, (err) => {
                console.log(err)
            });

            if (this.textureInfo.wrapS) {
                this.texture.wrapS = RepeatWrapping;
            }

            if (this.textureInfo.wrapT) {
                this.texture.wrapT = RepeatWrapping;
            }

            this.texture.flipY = false;
            params.map = this.texture;
        }

        return this.material = new MeshPhongMaterial(params);
    }

    getGeometry() {
        if (this.geometry) {
            return this.geometry;
        }

        const geometry = this.geometry = new Geometry();

        for (let [x, y, z] of this.vertices) {
            geometry.vertices.push(new Vector3(x, y, z))
        }

        const uvSets = [];

        for (let i = 0; i < this.uvSets.length; i++) {
            uvSets.push([]);
        }

        for (let i = 0; i < this.faces.length; i++) {
            let [a, b, c] = this.faces[i];

            // Add faces with normals
            // Normals are stored per vector
            geometry.faces.push(new Face3(a, b, c, [
                new Vector3(this.normals[a][0], this.normals[a][1], this.normals[a][2]),
                new Vector3(this.normals[b][0], this.normals[b][1], this.normals[b][2]),
                new Vector3(this.normals[c][0], this.normals[c][1], this.normals[c][2])
            ]));

            for (let j = 0; j < this.uvSets.length; j++) {
                uvSets[j].push([
                    new Vector2(this.uvSets[j][a][0], this.uvSets[j][a][1]),
                    new Vector2(this.uvSets[j][b][0], this.uvSets[j][b][1]),
                    new Vector2(this.uvSets[j][c][0], this.uvSets[j][c][1]),
                ])
            }
        }

        geometry.faceVertexUvs = uvSets;

        // First rotate
        let m = new Matrix4();
        m.makeBasis(new Vector3(...this.rotation[0]), new Vector3(...this.rotation[1]), new Vector3(...this.rotation[2]));
        geometry.applyMatrix4(m);

        // Then translate
        geometry.translate(this.translation[0], this.translation[1], this.translation[2]);

        // Scale up a bit
        geometry.scale(2, 2, 2);

        // Rotate the face so it faces us \o/
        geometry.rotateX(290 * (Math.PI / 180));

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return this.geometry;
    }

    getMesh() {
        if (this.mesh) {
            return this.mesh;
        }

        this.mesh = new Mesh(this.getGeometry(), this.getMaterial());
        return this.mesh;
    }
}