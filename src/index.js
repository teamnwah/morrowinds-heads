import {HeadRenderer} from "./HeadRenderer";
import * as THREE from "three";
import {ShapeCollection} from "./ShapeCollection";
import {uuidv4} from "./util";

const headRenderer = window.headRenderer = new HeadRenderer();

const part1 = document.querySelector("#part_1");
let shape1 = null;
const part2 = document.querySelector("#part_2");
let shape2 = null;

const race = document.querySelector("#race");
const gender = document.querySelector("#gender");

const prevHair = document.querySelector('#prev_hair');
const nextHair = document.querySelector('#next_hair');

const prevHead = document.querySelector('#prev_head');
const nextHead = document.querySelector('#next_head');


window.addEventListener("load", async () => {
    const allMeshes = await (await fetch("blob/meshes.json")).json();

    part1.innerHTML = "";
    part2.innerHTML = "";
    const indexed = {};
    const tree = {};
    const shapeCache = {};

    headRenderer.init();
    headRenderer.expose();

    for (let mesh of allMeshes) {
        let [_, x, race, gender, part, nr = undefined] = mesh.name.split('_');
        race = race.replace(new RegExp("\\s+"), ' ');
        if (race.toLowerCase() === "khajiit") {
            console.log(part, mesh.name, nr);
        }

        if (x !== 'N') {
            continue;
        }

        if (nr === undefined) {
            [_, part, nr] = part.match(/(head|hair)(\d+)?/i) || [];
            console.log(part);

            if (!nr) {
                continue;
            }
        }

        let option = document.createElement("option");
        option.textContent = mesh.name;
        option.value = mesh.id = uuidv4();
        indexed[mesh.id] = mesh;


        if (mesh.name.toLowerCase().indexOf("hair") !== -1) {
            part1.appendChild(option);
        }

        if (mesh.name.toLowerCase().indexOf("head") !== -1) {
            part2.appendChild(option);
        }

        if (!tree[race]) {
            tree[race] = {};
        }

        if (!tree[race][gender]) {
            tree[race][gender] = {'head': [], 'hair': []}
        }

        tree[race][gender][part.toLowerCase()].push(mesh.id);
    }

    race.innerHTML = "";
    for (let raceX in tree) {
        let option = document.createElement("option");
        option.textContent = raceX;
        option.value = raceX;
        race.appendChild(option);
    }

    race.addEventListener('change', () => {
        setRace(race.value);
    });

    function setRace(name) {
        race.value = name;
        gender.innerHTML = "";
        for (let genderX in tree[name]) {
            let option = document.createElement("option");
            option.textContent = genderX;
            option.value = genderX;
            gender.appendChild(option);
        }

        setGender(gender.value)
    }

    gender.addEventListener("change", () => {
        setGender(gender.value);
    });

    function setGender(name) {
        gender.value = name;
        setHair(tree[race.value][name]['hair'][0]);
        setHead(tree[race.value][name]['head'][0]);
    }

    setRace("Dark Elf");
    setGender("M");

    function getShape(name) {
        return new ShapeCollection(indexed[name], "blob/textures/");
    }

    function setHair(id) {
        part1.value = id;
        if (shape1 !== null) {
            headRenderer.remove(shape1);
        }
        headRenderer.add(shape1 = getShape(id));
    }

    part1.addEventListener("change", () => {
        setHair(part1.value);
    });

    prevHair.addEventListener('click', () => {
        let hairList = tree[race.value][gender.value]['hair'];
        setHair(hairList[(hairList.length + (hairList.indexOf(part1.value) - 1)) % hairList.length]);
    });

    nextHair.addEventListener('click', () => {
        let hairList = tree[race.value][gender.value]['hair'];
        setHair(hairList[(hairList.indexOf(part1.value) + 1) % hairList.length]);
    });

    function setHead(id) {
        part2.value = id;
        if (shape2 !== null) {
            headRenderer.remove(shape2);
        }
        headRenderer.add(shape2 = getShape(id));
    }

    part2.addEventListener("change", () => {
        setHead(part2.value);
    });


    prevHead.addEventListener('click', () => {
        let headList = tree[race.value][gender.value]['head'];
        setHead(headList[(headList.length + (headList.indexOf(part2.value) - 1)) % headList.length]);
    });

    nextHead.addEventListener('click', () => {
        let headList = tree[race.value][gender.value]['head'];
        setHead(headList[(headList.indexOf(part2.value) + 1) % headList.length]);
    });

    headRenderer.draw();
});

window.THREE = THREE;