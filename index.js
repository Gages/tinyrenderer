import { AFRICAN_FACE } from './model/african_head/african_head.obj.js';
import * as draw from './lib/draw.js';
import * as math from './lib/math.js';

let faces;
let vertices;
let vt;
let ctx;
let img;
let zbuf;
let texture;
let world2screen;

const black = [0, 0, 0]
const red = [255, 0, 0]
const green = [0, 255, 0]
const blue = [0, 0, 255]
const white = [255, 255, 255]
const g1 = [52, 232, 158]
const g2 = [15, 52, 67]
const light_dir = [0, 0, -1];
const light_color = math.vec_scalar_mult(white, 0.4);
const camera = [0, 0, 3];

Promise.resolve()
  .then(main_load)
  .then(main_draw)
  .then(() => {
    console.log("Finished", new Date().toLocaleString())
  })

async function main_load() {
  const appCanvas = document.getElementById('app');
  ctx = appCanvas.getContext("2d");
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  img = ctx.createImageData(width, height);
  zbuf = draw.createZBuffer(img);
  texture = await loadImageDataFromUrl('./model/african_head/african_head_diffuse.png');

  const m = read_model(AFRICAN_FACE);
  vertices = m.vertices;
  faces = m.faces;
  vt = m.vt;

  const projection = math.matrix_identity(4);
  projection[14] = -1 / camera[2];
  const viewport = calc_viewport(width / 8, height / 8, width * 3 / 4, height * 3 / 4);

  world2screen = (v) => {
    const m = [];
    math.v2m(m, v);
    math.matrix_4x4_mult_4x1(m, projection, m);
    math.matrix_4x4_mult_4x1(m, viewport, m);
    math.m2v(m, m);
    return m;
  }
  console.log(`Found ${vertices.length} vertices.`);
  console.log(`Found ${faces.length} faces.`);
}

function main_draw() {
  draw.fillf(img, (x, y) => {
    const t = (x + y) / (img.width + img.height);
    return math.vec_lerp(t, g1, g2);
  });

  //draw faces
  for (const f of faces) {
    const screen_coords = [];
    const world_coords = [];
    const texture_coords = [];
    for (let j = 0; j < 3; j++) {
      world_coords[j] = vertices[f[j]];
      screen_coords[j] = world2screen(world_coords[j]);
      texture_coords[j] = vt[f[j + 3]];
    }
    const n = math.vec_cross(
      math.vec_minus(world_coords[2], world_coords[0]),
      math.vec_minus(world_coords[1], world_coords[0])
    );
    math.vec_normalise_mut(n);
    const intensity = math.vec_dot(n, light_dir);
    if (intensity > 0) {
      draw.triangle(img, zbuf, screen_coords, texture_coords, texture, intensity, light_color);
    }
  }

  // gamma correct, flip image vertically, copy to canvas
  draw.gamma_correct(img, 2);
  draw.flip(img);
  ctx.putImageData(img, 0, 0);
}

/** DEFINITIONS */
function read_model(str) {
  const regex = /^(:?(v) (\S+) (\S+) (\S+))|(?:(f) (\d+)\/(\d+)\/(\d+) (\d+)\/(\d+)\/(\d+) (\d+)\/(\d+)\/(\d+))|(?:(vt) +(\S+) +(\S+))/gm;
  const vertices = [];
  const faces = [];
  const texture_coords = [];
  let array;
  while ((array = regex.exec(str)) !== null) {
    //console.dir(array);
    const tag = array[2] || array[6] || array[16];
    switch (tag) {
      case 'v':
        const v = [array[3], array[4], array[5]];
        vertices.push(v.map(Number));
        break;
      case 'f':
        const f = [
          array[7], array[10], array[13],
          array[8], array[11], array[14],
          array[9], array[12], array[15]
        ];
        faces.push(f.map(Number).map(f => f - 1));
        break;
      case 'vt':
        const vt = [array[17], array[18]];
        texture_coords.push(vt.map(Number));
        break;
    }
  }
  return { vertices, faces, vt: texture_coords };
}
function random_colour() {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ];
}
function loadImageDataFromUrl(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.addEventListener('load', function () {

      // create a canvas object
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      // copy image contents to canvas
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // copy imagedata
      let data = ctx.getImageData(0, 0, img.width, img.height);
      let rdata = new ImageData(img.width, img.height);
      draw.copyImageData(data, rdata);
      draw.flip(rdata);
      data = undefined;
      ctx = undefined;
      canvas = undefined;
      img = undefined;

      resolve(rdata);
    }, false);
    img.addEventListener('error', reject);
    img.src = url;
  });
}
function calc_viewport(x, y, w, h, depth = 255) {
  const m = math.matrix_identity(4);
  //0  1  2  3
  //4  5  6  7
  //8  9  10 11
  //12 13 14 15
  m[3] = x + w / 2;
  m[7] = y + h / 2;
  m[11] = depth / 2;
  m[0] = w / 2;
  m[5] = h / 2;
  m[10] = depth / 2;
  return m;
}