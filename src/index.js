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

const RACES = {
    'darkelf': 'Dark Elf',
    'khajiit': 'Khajiit',
    'woodelf': 'Wood Elf',
    'highelf': 'High Elf',
    'redguard': 'Redguard',
    'breton': 'Breton',
    'argonian': 'Argonian',
    'orc': 'Orc',
    'imperial': 'Imperial',
    'nord': 'Nord',
};

window.addEventListener("load", async () => {
    const allMeshes = await (await fetch("blob/meshes.json?v=2")).json();

    part1.innerHTML = "";
    part2.innerHTML = "";
    const indexed = window.indexed = {};
    const byName = window.byName = {};
    const tree = window.tree = {};

    headRenderer.init();
    headRenderer.expose();

    for (let mesh of allMeshes) {
        let [_, __, race = "object", gender = "X", part = "head", nr = undefined] = mesh.name.split('_');
        race = race.replace(new RegExp("\\s+"), '');
        race = RACES[race] || 'Object';

        if (nr === undefined && !['head', 'hair'].includes(part.toLowerCase())) {
            [_, part = "head", nr] = part.match(/(head|hair)(\d+)?/i) || [];
        }

        gender = gender.toUpperCase();

        let option = document.createElement("option");
        option.textContent = mesh.name;
        option.value = mesh.id = uuidv4();
        indexed[mesh.id] = mesh;
        byName[mesh.name] = mesh.id;

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

    function setRace(name, propagate = true) {
        race.value = name;
        gender.innerHTML = "";
        for (let genderX in tree[name]) {
            let option = document.createElement("option");
            option.textContent = genderX;
            option.value = genderX;
            gender.appendChild(option);
        }

        if (propagate) {
            setGender(gender.value)
        }
    }

    gender.addEventListener("change", () => {
        setGender(gender.value);
    });

    function setGender(name) {
        gender.value = name;
        setHair(tree[race.value][name]['hair'][0]);
        setHead(tree[race.value][name]['head'][0]);
    }

    // Collect hash query before setting defaults
    let q = collectHashQuery();

    // Dark Elf / M is what Morrowind starts you with
    setRace("Dark Elf", false);
    setGender("M");

    updateFromHash(q);

    function collectHashQuery() {
        return location.hash.substr(1).split('&').reduce((c, x) => {
            let [name, value = ""] = x.split('=', 2).map(y => decodeURIComponent(y));
            c[name] = value.toLowerCase();
            return c;
        }, {});
    }

    function updateFromHash(q) {
        if (!q) {
            q = collectHashQuery();
        }

        if (byName[q['head']] && q['head'].toLowerCase().includes('head')) {
            setHead(byName[q['head']]);
        } else {
            if (q['head']) {
                console.log("No head found with name: ", q['head']);
            }
        }

        if (byName[q['hair']] && q['hair'].toLowerCase().includes('hair')) {
            setHair(byName[q['hair']]);
        } else {
            if (q['hair']) {
                console.log("No hair found with name: ", q['hair']);
            }
        }
    }

    updateFromHash();

    window.addEventListener('hashchange', () => {
        updateFromHash();
    });

    function getShape(name) {
        return new ShapeCollection(indexed[name], "blob/texture/");
    }

    function updateHash() {
        location.hash = `head=${encodeURIComponent(indexed[part2.value].name)}&hair=${encodeURIComponent(indexed[part1.value].name)}`;
    }

    function setHair(id) {
        if (!id) return;

        part1.value = id;
        if (shape1 !== null) {
            headRenderer.remove(shape1);
        }
        headRenderer.add(shape1 = getShape(id));
        updateHash();
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
        if (!id) return;

        part2.value = id;
        if (shape2 !== null) {
            headRenderer.remove(shape2);
        }
        headRenderer.add(shape2 = getShape(id));
        updateHash();
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