import Seat from "./Seat";
import MusicStand from "./MusicStand";
import {
  calcPosFromLen,
  getRectfrom2pts,
  optimizeMusicStandsLayout,
  mergeActDispPoints,
} from "./util";
import { seatsArrangerInfo, cbLayerInfo, SimplePartsInfo } from "./data";
import AreaDivider from "./AreaDivider";
import HistoryManager from "./HistoryManager";
import CbLayer from "./CbLayer";
import SimpleParts from "./SimpleParts";

class SeatsArranger {
  static cbGroupId = 10;
  static cbLayerName = "CbLayer";
  constructor(seatsInfo, dispInfoCallbackFn = null, onChangeFn = null) {
    // console.log("SeatsArranger.constructor()");
    //        this.init()
    this.seatsInfoObj = seatsInfo;
    this.dispInfoCallbackFn = dispInfoCallbackFn;
    this.onChangeFn = onChangeFn;
  }
  init() {
    this.canvas = null;
    this.ctx = null;
    this.seats2D = []; // 座席の全情報
    this.tactPos = { x: 0, y: 0 }; // 指揮者の位置(※譜面台の位置を決定するのに必要)
    this.musicStands2D = []; // 譜面台の全情報（1列あたり 2 * 座席数 - 1  ※席と席の間にも一応配置していることに留意必要）
    this.selecting = false; //　矩形選択状態か否か
    this.initCompleted = false;
    this.selPos = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]; // 矩形選択状態のときの開始位置と終了位置
    this.areaDivider = new AreaDivider();
    this.cbLayer = new CbLayer(cbLayerInfo, SeatsArranger.cbGroupId, () =>
      this.update("CbLayer")
    );
    this.simplePartsList = [];
    this.printing = false;
    this.printingBefore1stDraw = false;
    this.printingArea = null;
    this.printingImg = null;
    this.prevKey = "";
    this.historyManager = new HistoryManager((dataObj) => {
      this.restoreData(dataObj);

      if (this.dispInfoCallbackFn !== null) {
        this.dispInfoCallbackFn(this.getDispInfo());
      }

      if (this.onChangeFn != null) {
        const dataJSON = JSON.stringify(dataObj);
        // console.log(`onChangeFn on undo/redo: size=${dataJSON.length}`);
        this.onChangeFn(dataJSON);
      }
    });
    this.initCompleted = true;
  }

  restoreData(dataObj) {
    // 履歴の復元
    this.forEachAllSeats((seat, row, col) => {
      seat.deserializeData(dataObj.seats2DData[row][col]);
    });
    this.forEachAllMusicStands((musicStand, row, col) => {
      musicStand.deserializeData(dataObj.musicStands2DData[row][col]);
    });
    this.areaDivider.deserializeData(dataObj.areaDividerData);
    this.cbLayer.deserializeData(dataObj.cbLayerData);
    this.simplePartsList.forEach((simpleParts, idx) => {
      simpleParts.deserializeData(dataObj.simplePartsListData[idx]);
    });
  }

  updateLayout(dataJSON) {
    // console.log(
    //   `updateLayout(length:${dataJSON.length}), register and restore.`
    // );
    if (dataJSON !== "") {
      try {
        var obj = JSON.parse(dataJSON);
        // データの保存（初期状態）
        this.historyManager.registerHistory(obj, true);
        // データの復元
        this.restoreData(obj);

        if (this.dispInfoCallbackFn !== null) {
          this.dispInfoCallbackFn(this.getDispInfo());
        }
      } catch (err) {
        /// エラー時の処理
        alert(err);
        return;
      }
    } else {
      // console.log("updateLayout: data size is zero. update default values.");
      this.update("");
    }
  }

  setCanvas(canvas) {
    this.init();
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.makeSeats(this.canvas.width, this.canvas.height);
  }
  // 作成関数
  // width:キャンバスの幅, height:キャンバスの高さ, customFunc:自作のシート作成関数を指定する場合は設定
  makeSeats(width, height, customFunc = null) {
    if (customFunc != null) {
      customFunc(width, height, this.tactPos, this.seats2D);
    } else {
      this.makeSeatsDefault(width, height, this.tactPos, this.seats2D);
    }

    // 譜面台の作成
    this.makeMusicStands();

    // 領域分割屋の設定
    // ・位置
    this.areaDivider.setArea(10, 10, width - 20, height - 20);

    // シンプル部品の生成
    this.makeSimpleParts();

    this.areaDivider.isInit = false;

    // ・分割対象の設定
    this.areaDivider.registerDividing(
      this.seats2D,
      (divIdList, drawPosList2D, divInfos) => {
        // 譜面台配置の最適化
        this.optimizeMusicStandsLayout();

        if (this.areaDivider.isInit) {
          this.update("areaDivider");
        }
      }
    );
    this.areaDivider.isInit = true;

    if (this.dispInfoCallbackFn !== null) {
      this.dispInfoCallbackFn(this.getDispInfo());
    }
  }

  // シート構成作成のデフォルト関数
  // [IN]width: キャンバスの幅
  // [IN]height: キャンバスの高さ
  // [OUT]tactPos: 指揮者の位置
  // [OUT]seats2D: シートの配置
  makeSeatsDefault(width, height, tactPos, seats2D) {
    const seatRadius = this.seatsInfoObj.seatRadius;
    const distCenterLR = this.seatsInfoObj.distCenterLR;
    const distSideLR = this.seatsInfoObj.distSideLR;
    const ellipticity = this.seatsInfoObj.ellipticity;
    const baseX = width / 2;
    const baseY = height - 70;
    this.seatsInfoObj.seatsCircles.forEach((seatCircle, row) => {
      // 座席一列ぶん（半円に近い形）
      const seats = [];
      let distCF = seatCircle.distCF;
      let numPart = seatCircle.num / 2 - 2;
      let seatObj = null;

      // 左右対称の片方ぶんのみの数が必要のため【2で割り】、1点は上記で固定表示するので分割には関係ないため減算で更にもう1点を分割数算出のために減算【合計2減算】
      // 半円の一番左側の下
      seatObj = new Seat(
        this.makePartsName("ST", row, 0),
        baseX - 0.5 * distCenterLR - distCF,
        baseY,
        seatRadius,
        1
      );
      seatObj.registerCallback((partsName, state) => {
        this.seatUpdate(partsName);
      });
      seats.push(seatObj);

      // 半円の左側すべて
      for (let i = 0; i <= numPart; i++) {
        seatObj = new Seat(
          this.makePartsName("ST", row, i + 1),
          baseX -
            0.5 * distCenterLR -
            distCF * Math.cos((0.5 * Math.PI * i) / numPart),
          baseY -
            distSideLR -
            ellipticity * distCF * Math.sin((0.5 * Math.PI * i) / numPart),
          seatRadius,
          1
        );
        seatObj.registerCallback((partsName, state) => {
          this.seatUpdate(partsName);
        });
        seats.push(seatObj);
      }
      // 半円の右側すべて
      for (let i = numPart; i >= 0; i--) {
        seatObj = new Seat(
          this.makePartsName("ST", row, (numPart + 1) * 2 - i),
          baseX +
            0.5 * distCenterLR +
            distCF * Math.cos((0.5 * Math.PI * i) / numPart),
          baseY -
            distSideLR -
            ellipticity * distCF * Math.sin((0.5 * Math.PI * i) / numPart),
          seatRadius,
          1
        );
        seatObj.registerCallback((partsName, state) => {
          this.seatUpdate(partsName);
        });
        seats.push(seatObj);
      }
      // 半円の一番右側の下
      seatObj = new Seat(
        this.makePartsName("ST", row, (numPart + 1) * 2 + 1),
        baseX + 0.5 * distCenterLR + distCF,
        baseY,
        seatRadius,
        1
      );
      seatObj.registerCallback((partsName, state) => {
        this.seatUpdate(partsName);
      });
      seats.push(seatObj);

      // 座席一列ぶんを全体格納領域へ登録
      seats2D.push(seats);

      // 座席一列ぶんの分割位置を保存（すべてfalseで分割無し状態）
      let splitIndexes = [];
      seats.forEach((seat) => splitIndexes.push(false));
    });

    // 指揮者の位置を少し上に移動する（譜面台の位置微調整のため）
    tactPos.x = baseX;
    tactPos.y = baseY - 30;
  }

  makeMusicStands() {
    this.seats2D.forEach((seats, row) => {
      const musicStands = [];
      let msObj = null;
      for (let col = 0; col < seats.length; col++) {
        const [posX, posY] = seats[col].getPos();
        let [standX, standY] = calcPosFromLen(
          posX,
          posY,
          this.tactPos.x,
          this.tactPos.y,
          seatsArrangerInfo.distToStand
        );
        msObj = new MusicStand(
          this.makePartsName("MS", row, col * 2),
          standX,
          standY
        );
        msObj.registerCallback((partsName, state) => {
          this.update(partsName);
        });
        musicStands.push(msObj);

        // まだ末端ではない場合
        if (col < seats.length - 1) {
          // 現在地と次の位置の間に譜面台を置く
          let [nextX, nextY] = seats[col + 1].getPos();
          let [standX, standY] = calcPosFromLen(
            (posX + nextX) / 2,
            (posY + nextY) / 2,
            this.tactPos.x,
            this.tactPos.y,
            seatsArrangerInfo.distToStand
          );
          msObj = new MusicStand(
            this.makePartsName("MS", row, col * 2 + 1),
            standX,
            standY
          );
          msObj.registerCallback((partsName, state) => {
            this.update(partsName);
          });
          musicStands.push(msObj);
        }
      }
      this.musicStands2D.push(musicStands);
    });
  }

  makeSimpleParts() {
    SimplePartsInfo.parts.forEach((partsInfo) => {
      const simpleParts = new SimpleParts(
        partsInfo.name,
        partsInfo.x,
        partsInfo.y,
        SimplePartsInfo.common.w,
        SimplePartsInfo.common.h,
        partsInfo.text,
        partsInfo.imgsrc
      );
      simpleParts.registerCallback((partsName, state) => {
        this.update(partsName);
      });
      this.simplePartsList.push(simpleParts);
    });
  }

  setSimplePartsVisible(partsName, visible) {
    const parts = this.simplePartsList.find(
      (simpleParts) => simpleParts.partsName === partsName
    );
    if (parts !== undefined) {
      parts.setVisible(visible);
    }
  }

  setPrintingMode(printing) {
    this.printing = printing;
    if (this.printing) {
      this.printingImg = null;
      this.printingBefore1stDraw = false;
    } else {
      this.printingImg = null;
    }
  }

  makePrintingImg() {
    const margin = 10;
    const actDispPoints = this.getActDispPoints();
    if (actDispPoints.visible) {
      // マージンぶんを加味して対象領域を抽出
      actDispPoints.staPos.x = Math.max(0, actDispPoints.staPos.x - margin);
      actDispPoints.staPos.y = Math.max(0, actDispPoints.staPos.y - margin);
      actDispPoints.endPos.x = Math.min(
        this.canvas.width,
        actDispPoints.endPos.x + margin
      );
      actDispPoints.endPos.y = Math.min(
        this.canvas.height,
        actDispPoints.endPos.y + margin
      );
      // w,y,w,h形式へ変換
      this.printingArea = {
        x: actDispPoints.staPos.x,
        y: actDispPoints.staPos.y,
        w: actDispPoints.endPos.x - actDispPoints.staPos.x,
        h: actDispPoints.endPos.y - actDispPoints.staPos.y,
      };
      const img = new Image();
      img.src = this.canvas.toDataURL();
      img.onload = () => {
        this.printingImg = img;
      };
    }
  }

  optimizeMusicStandsLayout() {
    this.seats2D.forEach((seats, row) => {
      optimizeMusicStandsLayout(seats, this.musicStands2D[row]);
    });
  }
  makePartsName(uniqname, row, col) {
    return uniqname + "_" + row.toString() + "_" + col.toString();
  }

  // {numOfSeats: {1:xxx, 2:xxx,...}, numOfStands: {1:xxx, 2:xxx,...} }
  getDispInfo() {
    const dispInfo = {
      numOfSeats: { all: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      numOfStands: { all: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      numOfPianoSeats: { all: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      numOfPersons: { all: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      simplePartsVisibles: [],
    };
    // 標準の座席のグループごとの席数抽出
    this.seats2D
      .flat()
      .filter((seat) => {
        return seat.isStandardSeat();
      })
      .forEach((seat) => {
        dispInfo.numOfSeats[seat.groupId] =
          dispInfo.numOfSeats[seat.groupId] === undefined
            ? 1
            : dispInfo.numOfSeats[seat.groupId] + 1;
        dispInfo.numOfSeats.all =
          dispInfo.numOfSeats.all === undefined
            ? 1
            : dispInfo.numOfSeats.all + 1;
      });

    // piano椅子のグループごとの席数抽出
    this.seats2D
      .flat()
      .filter((seat) => {
        return seat.isPianoSeat();
      })
      .forEach((seat) => {
        dispInfo.numOfPianoSeats[seat.groupId] =
          dispInfo.numOfPianoSeats[seat.groupId] === undefined
            ? 1
            : dispInfo.numOfPianoSeats[seat.groupId] + 1;
        dispInfo.numOfPianoSeats.all =
          dispInfo.numOfPianoSeats.all === undefined
            ? 1
            : dispInfo.numOfPianoSeats.all + 1;
      });

    // 人数のグループごとの席数抽出
    this.seats2D
      .flat()
      .filter((seat) => {
        return seat.hasPerson();
      })
      .forEach((seat) => {
        dispInfo.numOfPersons[seat.groupId] =
          dispInfo.numOfPersons[seat.groupId] === undefined
            ? 1
            : dispInfo.numOfPersons[seat.groupId] + 1;
        dispInfo.numOfPersons.all =
          dispInfo.numOfPersons.all === undefined
            ? 1
            : dispInfo.numOfPersons.all + 1;
      });

    // 譜面台のグループごとの個数抽出
    this.forEachAllMusicStands((musicStand, row, col) => {
      if (musicStand.isExistence()) {
        const groupId = this.seats2D[row][Math.floor(col / 2)].groupId;
        dispInfo.numOfStands[groupId] =
          dispInfo.numOfStands[groupId] === undefined
            ? 1
            : dispInfo.numOfStands[groupId] + 1;
        dispInfo.numOfStands.all =
          dispInfo.numOfStands.all === undefined
            ? 1
            : dispInfo.numOfStands.all + 1;
      }
    });

    // コントラバスの人数と譜面台の個数抽出
    dispInfo.numOfPersons[SeatsArranger.cbGroupId] =
      this.cbLayer.getNumOfPersons();
    dispInfo.numOfPersons.all =
      dispInfo.numOfPersons.all === undefined
        ? 1
        : dispInfo.numOfPersons.all +
          dispInfo.numOfPersons[SeatsArranger.cbGroupId];

    dispInfo.numOfStands[SeatsArranger.cbGroupId] =
      this.cbLayer.getNumOfStands();
    dispInfo.numOfStands.all =
      dispInfo.numOfStands.all === undefined
        ? 1
        : dispInfo.numOfStands.all +
          dispInfo.numOfStands[SeatsArranger.cbGroupId];

    // SimplePartsの状態の抽出
    this.simplePartsList.forEach((simpleParts) => {
      dispInfo.simplePartsVisibles.push({
        name: simpleParts.partsName,
        visible: simpleParts.visible,
      });
    });

    //CbLayerの状態の抽出
    dispInfo.simplePartsVisibles.push({
      name: SeatsArranger.cbLayerName,
      visible: this.cbLayer.visible,
    });

    return dispInfo;
  }

  getActDispPoints() {
    return mergeActDispPoints([
      this.seats2D,
      this.musicStands2D,
      [this.cbLayer],
      this.simplePartsList,
    ]);
  }

  onClick(x, y, event) {
    // 今は使用しない
  }

  onDoubleClick(x, y, event) {
    // 今は使用しない
  }

  onMouseDown(x, y, event) {
    if (!this.initCompleted) return;
    if (this.areaDivider.isHit(x, y)) {
      if (event.ctrlKey) {
        // 分割線に対してselected/unselectedを更新した場合はここで処理終了
        if (this.areaDivider.selectDivLinesFromPos(x, y, true) === true) {
          return;
        }
      }
    }

    if (this.cbLayer.isHit(x, y)) {
      this.cbLayer.onMouseDown(x, y, event);
      return;
    }

    for (let idx = 0; idx < this.simplePartsList.length; idx++) {
      if (this.simplePartsList[idx].isHit(x, y) === true) {
        this.simplePartsList[idx].onMouseDown(x, y, event);
        return;
      }
    }
    for (let row = 0; row < this.seats2D.length; row++) {
      for (let col = 0; col < this.seats2D[row].length; col++) {
        let seat = this.seats2D[row][col];
        if (seat.isHit(x, y) === true) {
          if (event.ctrlKey) {
            seat.selected = seat.selected ? false : true;
          } else {
            seat.onMouseDown(x, y, event);
          }
          return;
        }
      }
    }
    for (let row = 0; row < this.musicStands2D.length; row++) {
      for (let col = 0; col < this.musicStands2D[row].length; col++) {
        let musicStand = this.musicStands2D[row][col];
        if (musicStand.isHit(x, y) === true) {
          musicStand.onMouseDown(x, y, event);
          return;
        }
      }
    }

    // 矩形選択状態の更新
    if (event.ctrlKey) {
      this.selecting = true;
      this.selPos[0].x = this.selPos[1].x = x;
      this.selPos[0].y = this.selPos[1].y = y;
    } else {
      // 選択状態の解除
      this.clearSelectedStates();

      this.areaDivider.onMouseDown(x, y, event);
    }
  }

  onMouseMove(x, y, event) {
    if (!this.initCompleted) return;
    if (this.selecting === true) {
      if (event.ctrlKey) {
        this.selPos[1].x = x;
        this.selPos[1].y = y;
      } else {
        this.selecting = false;
      }
    } else {
      this.cbLayer.onMouseMove(x, y, event);

      this.simplePartsList.forEach((simpleParts) => {
        simpleParts.onMouseMove(x, y, event);
      });
      this.forEachAllSeats((seat) => {
        seat.onMouseMove(x, y, event);
      });
      this.forEachAllMusicStands((musicStand) => {
        musicStand.onMouseMove(x, y, event);
      });

      this.areaDivider.onMouseMove(x, y, event);
    }
  }

  onMouseUp(x, y, event) {
    if (!this.initCompleted) return;
    this.cbLayer.onMouseUp(x, y, event);

    this.simplePartsList.forEach((simpleParts) => {
      simpleParts.onMouseUp(x, y, event);
    });
    this.forEachAllSeats((seat) => {
      seat.onMouseUp(x, y, event);
    });
    this.forEachAllMusicStands((musicStand) => {
      musicStand.onMouseUp(x, y, event);
    });

    this.areaDivider.onMouseUp(x, y, event);

    if (this.selecting === true) {
      if (event.ctrlKey) {
        this.selPos[1].x = x;
        this.selPos[1].y = y;

        this.forEachAllSeats((seat) => {
          if (
            ((this.selPos[0].x <= seat.x && seat.x <= this.selPos[1].x) ||
              (this.selPos[1].x <= seat.x && seat.x <= this.selPos[0].x)) &&
            ((this.selPos[0].y <= seat.y && seat.y <= this.selPos[1].y) ||
              (this.selPos[1].y <= seat.y && seat.y <= this.selPos[0].y))
          ) {
            seat.selected = true;
          }
        });
        // 矩形選択領域に分割線の頂点のいずれかが含まれているなら選択状態にする
        const [x1, y1, w, h] = getRectfrom2pts(
          this.selPos[0].x,
          this.selPos[0].y,
          this.selPos[1].x,
          this.selPos[1].y
        );
        this.areaDivider.selectDivLinesFromRect(x1, y1, w, h);
      }
      this.selecting = false;
    }
  }

  onMouseOut(event) {
    if (!this.initCompleted) return;
    this.cbLayer.onMouseOut();
    this.areaDivider.onMouseOut();
    this.selecting = false;
  }

  onKeyDown(event) {
    if (!this.initCompleted) return;
    console.log(`onKeyDown: key:${event.key}, ctrl:${event.ctrlKey}`);
    switch (event.key) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        // 選択状態の座席のgroupIdを変更する
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.groupId = Number(event.key);
          }
        });
        this.seatUpdate("");
        break;
      case " ":
        if (event.ctrlKey) {
          this.forEachAllSeats((seat) => {
            if (seat.selected === true) {
              seat.changeNormalAndSpecialState();
            }
          });
          this.seatUpdate("");
        }
        break;
      case "Backspace":
      case "Delete":
        // 選択状態の座席を隠す
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.selected = false;
            seat.setVisualState(Seat.VisualState.Hide);
          }
        });
        // 選択状態の分割線を削除する
        this.areaDivider.deleteSelectedDivLines();

        this.seatUpdate("");
        break;
      case "h":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.Hide);
          }
        });
        this.seatUpdate("");
        break;
      case "n":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.Normal);
          }
        });
        this.seatUpdate("");
        break;
      case "b":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.Black);
          }
        });
        this.seatUpdate("");
        break;
      case "r":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.Red);
          }
        });
        this.seatUpdate("");
        break;
      case "B":
      case "R":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.RedAndBlack);
          }
        });
        break;
      case "d":
        this.forEachAllSeats((seat) => {
          if (seat.selected === true) {
            seat.setVisualState(Seat.VisualState.DoubleCircle);
          }
        });
        this.seatUpdate("");
        break;
      case "y":
        if (event.ctrlKey) {
          this.historyManager.redo();
        }
        break;
      case "z":
        if (event.ctrlKey) {
          this.historyManager.undo();
        }
        break;
      case "Escape":
        this.clearSelectedStates();
        break;
      default:
        break;
    }
    this.prevKey = event.key;
  }

  onKeyUp(event) {
    if (!this.initCompleted) return;
    // console.log(`onKeyUp  : key:${event.key}, ctrl:${event.ctrlKey}`);
    // if ((this.prevKey === "Escape" && event.key === "Escape")) {
    // }
    this.prevKey = "";
  }

  forEachAllSeats(func) {
    this.seats2D.forEach((seats, row) => {
      seats.forEach((seat, col) => {
        func(seat, row, col, this.seats2D);
      });
    });
  }
  forEachAllMusicStands(func) {
    this.musicStands2D.forEach((musicStands, row) => {
      musicStands.forEach((musicStand, col) => {
        func(musicStand, row, col, this.musicStands2D);
      });
    });
  }

  clearSelectedStates() {
    this.selecting = false;

    // 座席の選択状態をクリア
    this.forEachAllSeats((seat) => {
      seat.selected = false;
    });
    // 領域分割の選択状態を解除
    this.areaDivider.cancelSelectedDivLines();
  }

  setCbLayerVisible(visible) {
    this.cbLayer.setVisible(visible);
  }

  update(partsName, silentMode = false) {
    // console.log("updated!:" + partsName);
    //        console.log("------------ Size ----------------")
    // 履歴を保存
    const seats2DData = [];
    this.seats2D.forEach((seats, row) => {
      seats2DData[row] = [];
      seats.forEach((seat, col) => {
        seats2DData[row][col] = seat.serializeData();
        //                console.log(`Size: seats2DData[${row}][${col}]=${seats2DData[row][col].length}`)
      });
    });

    const musicStands2DData = [];
    this.musicStands2D.forEach((musicStands, row) => {
      musicStands2DData[row] = [];
      musicStands.forEach((musicStand, col) => {
        musicStands2DData[row][col] = musicStand.serializeData();
        //               console.log(`Size: musicStands2DData[${row}][${col}]=${musicStands2DData[row][col].length}`)
      });
    });

    const simplePartsListData = [];
    this.simplePartsList.forEach((simpleParts, idx) => {
      simplePartsListData[idx] = simpleParts.serializeData();
      //           console.log(`Size: simplePartsListData[${idx}]=${simplePartsListData[idx].length}`)
    });
    //        console.log(`Size: areaDivider=${this.areaDivider.serializeData().length}`)
    //        console.log(`Size: cbLayer=${this.cbLayer.serializeData().length}`)

    const dataObj = {
      seats2DData: seats2DData,
      musicStands2DData: musicStands2DData,
      areaDividerData: this.areaDivider.serializeData(),
      cbLayerData: this.cbLayer.serializeData(),
      simplePartsListData: simplePartsListData,
    };

    this.historyManager.registerHistory(dataObj);

    if (this.dispInfoCallbackFn !== null) {
      this.dispInfoCallbackFn(this.getDispInfo());
    }

    if (this.onChangeFn != null && !silentMode) {
      const dataJSON = JSON.stringify(dataObj);
      // console.log(`onChangeFn on update: size=${dataJSON.length}`);
      this.onChangeFn(dataJSON);
    }
  }

  seatUpdate(partsName) {
    // 譜面台配置の最適化
    this.optimizeMusicStandsLayout();

    this.update(partsName);
  }
  draw() {
    const ctx = this.ctx;

    // まず背景をクリア
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 印刷用モードでCanvas全体イメージを抽出出来た場合
    if (
      this.printing &&
      this.printingArea != null &&
      this.printingImg !== null
    ) {
      // キャンバス全体イメージから部分抽出してそれを広げて表示
      ctx.drawImage(
        this.printingImg,
        this.printingArea.x,
        this.printingArea.y,
        this.printingArea.w,
        this.printingArea.h,
        this.printingArea.w / this.printingArea.h >
          this.canvas.width / this.canvas.height
          ? 0
          : (this.canvas.width -
              (this.printingArea.w * this.canvas.height) /
                this.printingArea.h) /
              2,
        this.printingArea.w / this.printingArea.h >
          this.canvas.width / this.canvas.height
          ? (this.canvas.height -
              (this.printingArea.h * this.canvas.width) / this.printingArea.w) /
              2
          : 0,
        this.printingArea.w / this.printingArea.h >
          this.canvas.width / this.canvas.height
          ? this.canvas.width
          : (this.printingArea.w * this.canvas.height) / this.printingArea.h,
        this.printingArea.w / this.printingArea.h >
          this.canvas.width / this.canvas.height
          ? (this.printingArea.h * this.canvas.width) / this.printingArea.w
          : this.canvas.height
      );
      return;
    }

    // 座席の描画
    this.forEachAllSeats((seat) => {
      seat.draw(ctx, this.printing);
    });
    // 譜面台の描画
    this.forEachAllMusicStands((musicStand) => {
      musicStand.draw(ctx, this.printing);
    });
    // 指揮者は矩形描画だけのためここで直接書く
    this.drawTact(ctx, this.printing);

    // 領域分割屋を描画
    this.areaDivider.draw(ctx, this.printing);

    // シンプル部品を描画
    this.simplePartsList.forEach((simpleParts) => {
      simpleParts.draw(ctx, this.printing);
    });

    // Cb（コントラバスの）レイヤーを描画
    this.cbLayer.draw(ctx, this.printing);

    // 矩形選択ありなら矩形選択領域を表示
    if (this.selecting === true) {
      this.drawSelRect(ctx, this.printing);
    }
    if (this.printing && !this.printingBefore1stDraw) {
      this.printingBefore1stDraw = true;
      this.makePrintingImg();
    }
  }
  drawTact(ctx, printing = false) {
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.lineWidth = 4;
    const w = seatsArrangerInfo.tactWH.w;
    const h = seatsArrangerInfo.tactWH.h;
    ctx.strokeRect(this.tactPos.x - w / 2, this.tactPos.y - h / 2, w, h);
  }
  drawSelRect(ctx, printing = false) {
    // 印刷時表示なら描画しない
    if (printing) {
      return;
    }
    ctx.beginPath();
    ctx.setLineDash([1, 3]);
    ctx.strokeStyle = "rgb(100, 76, 76)";
    ctx.lineWidth = 3;
    const [x, y, w, h] = getRectfrom2pts(
      this.selPos[0].x,
      this.selPos[0].y,
      this.selPos[1].x,
      this.selPos[1].y
    );
    ctx.strokeRect(x, y, w, h);
  }

  end() {}
}

export default SeatsArranger;
