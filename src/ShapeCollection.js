import {Shape} from "./Shape";
import {Group} from "three";
import {uuidv4} from "./util";

export class ShapeCollection {
    constructor({shapes = [], name = ""}, filePrefix = "") {
        this.id = uuidv4();
        this.shapes = shapes.map((s) => new Shape(s, filePrefix));
        this.group = null;
    }

    getGroup() {
        if (this.group) {
            return this.group;
        }

        // Create group for all shapes
        this.group = new Group();

        for (let shape of this.shapes) {
            this.group.add(shape.getMesh())
        }

        return this.group
    }
}