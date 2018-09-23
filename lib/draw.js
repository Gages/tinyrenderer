import * as math from './math.js'

export function copyImageData(from, to) {
  for (let i = 0; i < from.data.length && i < to.data.length; i++) {
    to.data[i] = from.data[i];
  }
}
export function set_pixel(img, i, c) {
  img.data[i] = c[0];
  img.data[i + 1] = c[1];
  img.data[i + 2] = c[2];
  img.data[i + 3] = 255;
}
export function set_pixel_xy(img, x, y, c) {
  set_pixel(img, pixel_offset(img, x, y), c);
}
export function pixel_offset(img, x, y) {
  return 4 * (Math.round(y) * img.width + Math.round(x));
}
export function flip(img) {
  const width = img.width;
  const height = img.height;
  let color = [];
  for (let y = 0; y < height / 2; y++) {
    for (let x = 0; x < width; x++) {
      const i1 = pixel_offset(img, x, y);
      const i2 = pixel_offset(img, x, height - y - 1); // TODO: Why do I need this -1 here, to remove the top black bar?
      swap(img, i1, i2);
      swap(img, i1 + 1, i2 + 1);
      swap(img, i1 + 2, i2 + 2);
    }
  }
}
export function swap(img, i1, i2) {
  const temp = img.data[i1];
  img.data[i1] = img.data[i2];
  img.data[i2] = temp;
}
export function fill(img, colour) {
  for (let i = 0; i < img.data.length; i += 4) {
    set_pixel(img, i, colour);
  }
}
export function fillf(img, f) {
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      set_pixel_xy(img, x, y, f(x, y));
    }
  }
}
export function gamma_correct(img, gamma) {
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = Math.pow(img.data[i] / 255, gamma) * 255;
    img.data[i + 1] = Math.pow(img.data[i + 1] / 255, gamma) * 255;
    img.data[i + 2] = Math.pow(img.data[i + 2] / 255, gamma) * 255;
  }
}
export function line(img, x0, y0, x1, y1, c) {
  let steep = false;
  if (Math.abs(x0 - x1) < Math.abs(y0 - y1)) {
    [x0, y0] = [y0, x0]; //swap x0, y0
    [x1, y1] = [y1, x1]; //swap x1, y1
    steep = true;
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const y = y0 * (1 - t) + y1 * t;
    if (steep) {
      set_pixel_xy(img, y, x, c);
    } else {
      set_pixel_xy(img, x, y, c);
    }
  }
}
export function triangle(img, zbuf, pts, uvs, texture, intensity, light_colour) {
  const screen_clamp = [0, 0, img.width, img.height];
  const bbox = math.bounding_box(pts);
  math.clamp_box(bbox, screen_clamp);
  for (let px = bbox[0]; px <= bbox[2]; px++) {
    for (let py = bbox[1]; py <= bbox[3]; py++) {
      const [bx, by, bz] = math.triangle_barycentric(pts, px, py);
      if (bx < 0 || by < 0 || bz < 0) {
        continue;
      }
      const z = bx * pts[0][2] + by * pts[1][2] + bz * pts[2][2];
      // set_pixel_xy(img, px, py, colour);
      const i = py * img.width + px;
      if (zbuf[i] < z) {
        zbuf[i] = z;
        const u = bx * uvs[0][0] + by * uvs[1][0] + bz * uvs[2][0];
        const v = bx * uvs[0][1] + by * uvs[1][1] + bz * uvs[2][1];
        // console.log(u, v);
        const colour1 = get_texel(texture, u, v);
        const colour2 = math.vec_lerp(intensity, colour1, light_colour);
        set_pixel_xy(img, px, py, colour2);
      }
    }
  }
}
export function createZBuffer(img) {
  const zbuf = new Float32Array(img.data.length);
  clearZBuffer(zbuf);
  return zbuf;
}
export function clearZBuffer(zbuf) {
  for (let i = 0; i < zbuf.length; i++) {
    zbuf[i] = Number.NEGATIVE_INFINITY;
  }
}
export function get_texel(texture, u, v) {
  const i = pixel_offset(texture, u * texture.width, v * texture.height);
  return [
    texture.data[i],
    texture.data[i + 1],
    texture.data[i + 2]
  ];
}