import piano_image from "./images/piano.png";

// 下記レイアウトの数値を決定する際に前提にしていた画面サイズ
const assumedW = 1800;

// 実際の画面サイズ
const actualW = 1400;

// レイアウトの数値（前提画面サイズをもとにした値）を実際の画面サイズを考慮した数値へ変換するための補正値。幅の値だけ考慮する（縦・横比は共通にするため）
const adjScale = actualW / assumedW;

export const canvasInfo = {
  w: 1800 * adjScale,
  h: 900 * adjScale,
};

export const seatsArrangerInfo = {
  distToStand: 40 * adjScale,
  tactWH: {
    w: 100 * adjScale,
    h: 65 * adjScale,
  },
};

export const seatsInfo = {
  seatRadius: 33 * adjScale,
  distCenterLR: 75 * adjScale,
  distSideLR: 75 * adjScale,
  ellipticity: 0.9,
  seatsCircles: [
    {
      distCF: 100 * adjScale,
      num: 8,
    },
    {
      distCF: 200 * adjScale,
      num: 12,
    },
    {
      distCF: 300 * adjScale,
      num: 16,
    },
    {
      distCF: 400 * adjScale,
      num: 20,
    },
    {
      distCF: 500 * adjScale,
      num: 24,
    },
    {
      distCF: 600 * adjScale,
      num: 28,
    },
    {
      distCF: 700 * adjScale,
      num: 32,
    },
  ],
};

export const cbLayerInfo = {
  rect: {
    x: 1270 * adjScale,
    y: 70 * adjScale,
    w: 500 * adjScale,
    h: 140 * adjScale,
  },
  seatWH: {
    w: 58 * adjScale,
    h: 58 * adjScale,
  },
  distToStand: 55 * adjScale,
  seatsInfs: [
    {
      x: 0 * adjScale,
      y: 0 * adjScale,
    },
    {
      x: 80 * adjScale,
      y: 0 * adjScale,
    },
    {
      x: 160 * adjScale,
      y: 0 * adjScale,
    },
    {
      x: 240 * adjScale,
      y: 0 * adjScale,
    },
    {
      x: 320 * adjScale,
      y: 0 * adjScale,
    },
    {
      x: 400 * adjScale,
      y: 0 * adjScale,
    },
  ],
};

export const SimplePartsInfo = {
  common: {
    w: 120 * adjScale,
    h: 60 * adjScale,
  },
  parts: [
    {
      name: "Vn1-label",
      text: "Vn1",
      imgsrc: null,
      x: 15 * adjScale,
      y: 70 * adjScale,
    },
    {
      name: "Vn2-label",
      text: "Vn2",
      imgsrc: null,
      x: 15 * adjScale,
      y: 140 * adjScale,
    },
    {
      name: "Vn3-label",
      text: "Vn3",
      imgsrc: null,
      x: 15 * adjScale,
      y: 210 * adjScale,
    },
    {
      name: "Va-label",
      text: "Va",
      imgsrc: null,
      x: 15 * adjScale,
      y: 280 * adjScale,
    },
    {
      name: "Vc-label",
      text: "Vc",
      imgsrc: null,
      x: 15 * adjScale,
      y: 350 * adjScale,
    },
    {
      name: "Cb-label",
      text: "Cb",
      imgsrc: null,
      x: 15 * adjScale,
      y: 420 * adjScale,
    },
    {
      name: "Pf-image",
      text: "",
      imgsrc: piano_image,
      x: 15 * adjScale,
      y: 490 * adjScale,
    },
  ],
};
