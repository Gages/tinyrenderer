
export function clamp(v, min, max) {
  if(min > max) {
    const temp = min;
    min = max;
    max = temp;
  }
  return Math.max(Math.min(v, max), min);
}
export function bounding_box(pts) {
  const bbox = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ];
  for(let p of pts) {
    const x = Math.floor(p[0]);
    const y = Math.floor(p[1]);
    bbox[0] = Math.min(bbox[0], x);
    bbox[1] = Math.min(bbox[1], y);
    bbox[2] = Math.max(bbox[2], x);
    bbox[3] = Math.max(bbox[3], y);
  }
  return bbox;
}
export function clamp_box(box, cbox) {
  box[0] = Math.max(box[0], cbox[0]) //min x
  box[1] = Math.max(box[1], cbox[1]) //min y
  box[2] = Math.min(box[2], cbox[2]) //max x
  box[3] = Math.min(box[3], cbox[3]) //max y
}
export function triangle_barycentric(pts, px, py) {
  const v0 = [
    pts[2][0]-pts[0][0],
    pts[1][0]-pts[0][0],
    pts[0][0]-px
  ];
  const v1 = [
    pts[2][1]-pts[0][1],
    pts[1][1]-pts[0][1],
    pts[0][1]-py
  ];
  const [x,y,z] = vec_cross(v0,v1);
  // triangle is degenerate, in this case return smth with negative coordinates
  if(Math.abs(z) < 1) return [-1,1,1];
  return [1 - (x+y)/z, y/z, x/z];  
}
export function triangle_point_within(pts, px, py) {
  const [bx, by, bz] = triangle_barycentric(pts, px, py);
  return !(bx < 0 || by < 0 || bz < 0);
}
export function vec_cross(u, v) {
  return [
    u[1]*v[2]-u[2]*v[1],
    u[2]*v[0]-u[0]*v[2],
    u[0]*v[1]-u[1]*v[0]
  ];
}
export function vec_minus(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function vec_dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function vec_normalise_mut(n) {
  const mag = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  n[0] /= mag;
  n[1] /= mag;
  n[2] /= mag;
}
export function vec_scalar_mult(v, scalar) {
  return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
}
export function vec_lerp(t, from, to) {
  const out = []
  for(let i = 0; i < 3; i++) {
    out[i] = (from[i] * t) + (to[i] * (1 - t));
  }
  return out;
}