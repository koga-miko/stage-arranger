import RectSeat from "./RectSeat";
import MusicStand from "./MusicStand";
import {
  optimizeMusicStandsLayout,
  isHitPolygon,
  calcLenRadFromPos,
  getRotAbsPos,
  mergeActDispPoints,
} from "./util";

class CbLayer {
  static State = {
    Idle: "Idle",
    Moving: "Moving",
    Rotating: "Rotating",
  };
  constructor(cbLayerInfo, groupId, callbackFn) {
    this.visible = false;
    this.rectPositions = [
      { x: cbLayerInfo.rect.x, y: cbLayerInfo.rect.y },
      { x: cbLayerInfo.rect.x + cbLayerInfo.rect.w, y: cbLayerInfo.rect.y },
      {
        x: cbLayerInfo.rect.x + cbLayerInfo.rect.w,
        y: cbLayerInfo.rect.y + cbLayerInfo.rect.h,
      },
      { x: cbLayerInfo.rect.x, y: cbLayerInfo.rect.y + cbLayerInfo.rect.h },
    ];
    this.centerPos = {
      x: cbLayerInfo.rect.x + cbLayerInfo.rect.w / 2,
      y: cbLayerInfo.rect.y + cbLayerInfo.rect.h / 2,
    };
    this.cbSeats2D = [];
    this.musicStands2D = [];
    this.callbackFn = callbackFn;
    this.state = CbLayer.State.Idle;
    this.movStaPos = { x: 0, y: 0 };
    this.movVal = { x: 0, y: 0 };
    this.rotStaRad = 0;
    this.rotCurRad = 0;

    // 座席位置の補正
    let offsetX = 0;
    let offsetY = 0;
    if (cbLayerInfo.seatsInfs.length > 0) {
      offsetX =
        cbLayerInfo.rect.x
        + cbLayerInfo.rect.w / 2
        - (cbLayerInfo.seatsInfs[0].x +
           cbLayerInfo.seatsInfs[cbLayerInfo.seatsInfs.length - 1].x) / 2;
      offsetY = cbLayerInfo.rect.y
        + cbLayerInfo.rect.h / 2
        + cbLayerInfo.distRow / 2
        - 5; // "5"は見た目の微調整で決定した
    }

    for(let row = 0; row < cbLayerInfo.numOfRows; row++) {
      this.cbSeats2D[row] = [];
      this.musicStands2D[row] = [];
      cbLayerInfo.seatsInfs.forEach((seatInf, idx) => {
        let seatObj = new RectSeat(
          this.makePartsName("CBSeat", idx),
          offsetX + cbLayerInfo.seatsInfs[idx].x,
          offsetY + cbLayerInfo.seatsInfs[idx].y - row * cbLayerInfo.distRow,
          cbLayerInfo.seatWH.w,
          cbLayerInfo.seatWH.h,
          groupId
        );
        // 1列目以外は非表示化しておく
        if (row !== 0) {
          seatObj.hide();
        }
        seatObj.registerCallback((partsName, state) => {
          this.seatsUpdate(partsName);
        });
        this.cbSeats2D[row].push(seatObj);
  
        let msObj = new MusicStand(
          this.makePartsName("CBMS", idx * 2),
          offsetX + cbLayerInfo.seatsInfs[idx].x,
          offsetY + cbLayerInfo.seatsInfs[idx].y + cbLayerInfo.distToStand - row * cbLayerInfo.distRow
        );
        msObj.registerCallback((partsName, state) => {
          this.update(partsName);
        });
        this.musicStands2D[row].push(msObj);
  
        // まだ末端ではない場合
        if (idx < cbLayerInfo.seatsInfs.length - 1) {
          // 現在地と次の位置の間に譜面台を置く
          msObj = new MusicStand(
            this.makePartsName("CBMS", idx * 2 + 1),
            offsetX +
              (cbLayerInfo.seatsInfs[idx].x + cbLayerInfo.seatsInfs[idx + 1].x) /
                2,
            offsetY + cbLayerInfo.seatsInfs[idx].y + cbLayerInfo.distToStand - row * cbLayerInfo.distRow
          );
          msObj.registerCallback((partsName, state) => {
            this.update(partsName);
          });
          this.musicStands2D[row].push(msObj);
        }
      });
      optimizeMusicStandsLayout(this.cbSeats2D[row], this.musicStands2D[row]);
    }
  }

  serializeData() {
    const cbSeatsData2D = [];
    this.cbSeats2D.forEach((cbSeats, row) => {
      cbSeatsData2D[row] = [];
      cbSeats.forEach((cbSeat) => {
        cbSeatsData2D[row].push(cbSeat.serializeData());
      });
    });
    const musicStandsData2D = [];
    this.musicStands2D.forEach((musicStands, row) => {
      musicStandsData2D[row] = [];
      musicStands.forEach((musicStand) => {
        musicStandsData2D[row].push(musicStand.serializeData());
      });
    });
    const jsonStr = JSON.stringify({
      visible: this.visible,
      rectPositions: this.rectPositions,
      centerPos: this.centerPos,
      cbSeatsData2D: cbSeatsData2D,
      musicStandsData2D: musicStandsData2D,
    });
    return jsonStr;
  }

  deserializeData(serializedData) {
    try {
      var obj = JSON.parse(serializedData);
    } catch (e) {
      /// エラー時の処理
      console.e("Failed to parse json");
      return;
    }
    this.visible = obj.visible;
    if (obj.cbSeatsData2D && obj.musicStandsData2D) {
      this.rectPositions = obj.rectPositions;
      this.centerPos = obj.centerPos;
        this.cbSeats2D.forEach((cbSeats, row) => {
        cbSeats.forEach((cbSeat, idx) => {
          cbSeat.deserializeData(obj.cbSeatsData2D[row][idx]);
        });
      })
      this.musicStands2D.forEach((musicStands, row) => {
        musicStands.forEach((musicStand, idx) => {
          musicStand.deserializeData(obj.musicStandsData2D[row][idx]);
        });
      })
    } else {
      for(let idx = 0; idx < this.cbSeats2D[0].length; idx++) {
        this.cbSeats2D[0][idx].deserializeDataWithoutArea(obj.cbSeatsData[idx]);
      }
      for(let idx = 0; idx < this.cbSeats2D[1].length; idx++) {
        this.cbSeats2D[1][idx].hide();
      }
      for(let idx = 0; idx < this.musicStands2D[0].length; idx++) {
        this.musicStands2D[0][idx].deserializeDataWithoutPos(obj.musicStandsData[idx]);
      }
      for(let idx = 0; idx < this.musicStands2D[1].length; idx++) {
        this.musicStands2D[1][idx].activate(false);
      }
    }
  }

  setVisible(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      this.update();
    }
  }

  makePartsName(uniqname, col) {
    return uniqname + "_" + col.toString();
  }

  getCenterPos() {
    return this.centerPos;
  }

  getActDispPoints() {
    if (this.visible) {
      return mergeActDispPoints(this.cbSeats2D);
    }
    return { visible: false };
  }

  isHit(x, y) {
    if (this.visible === false) {
      return false;
    }
    return isHitPolygon(x, y, this.rectPositions);
  }

  seatsUpdate(partsname) {
    this.cbSeats2D.forEach((cbSeats, row) => {
      optimizeMusicStandsLayout(cbSeats, this.musicStands2D[row]);
    })
    this.update(partsname);
  }

  update(partsname) {
    if (this.callbackFn !== null) {
      this.callbackFn();
    }
  }

  getNumOfPersons() {
    return this.visible
      ? this.cbSeats2D.flat().filter((cbSeat) => {
          return cbSeat.hasPerson();
        }).length
      : 0;
  }

  getNumOfStands() {
    return this.visible
      ? this.musicStands2D.flat().filter((musicStand) => {
          return musicStand.isExistence();
        }).length
      : 0;
  }

  onMouseDown(x, y, event) {
    if (this.visible === false) {
      return;
    }

    this.state = CbLayer.State.Idle;
    for (let row = 0; row < this.cbSeats2D.length; row++) {
      for (let col = 0; col < this.cbSeats2D[row].length; col++) {
        if (this.cbSeats2D[row][col].isHit(x, y) === true) {
          this.cbSeats2D[row][col].onMouseDown(x, y, event);
          return;
        }
      }
    }
    for (let row = 0; row < this.musicStands2D.length; row++) {
      for (let col = 0; col < this.musicStands2D[row].length; col++) {
        if (this.musicStands2D[row][col].isHit(x, y) === true) {
          this.musicStands2D[row][col].onMouseDown(x, y, event);
          return;
        }
      }
    }
    if (this.isHit(x, y)) {
      if (event.ctrlKey) {
        this.state = CbLayer.State.Rotating;
        const lenRad = calcLenRadFromPos(
          this.centerPos.x,
          this.centerPos.y,
          x,
          y
        );
        this.rotStaRad = this.rotCurRad = lenRad.radian;
      } else {
        this.state = CbLayer.State.Moving;
        this.movStaPos.x = x;
        this.movStaPos.y = y;
        this.movVal.x = 0;
        this.movVal.y = 0;
      }
    }
  }
  onMouseMove(x, y, event) {
    if (this.state === CbLayer.State.Moving) {
      this.movVal.x = x - this.movStaPos.x;
      this.movVal.y = y - this.movStaPos.y;
    } else if (this.state === CbLayer.State.Rotating) {
      const lenRad = calcLenRadFromPos(
        this.centerPos.x,
        this.centerPos.y,
        x,
        y
      );
      this.rotCurRad = lenRad.radian;
    }
    for (let row = 0; row < this.cbSeats2D.length; row++) {
      for (let col = 0; col < this.cbSeats2D[row].length; col++) {
        this.cbSeats2D[row][col].onMouseMove(x, y, event);
      }
    }
    for (let row = 0; row < this.musicStands2D.length; row++) {
      for (let col = 0; col < this.musicStands2D[row].length; col++) {
        this.musicStands2D[row][col].onMouseMove(x, y, event);
      }
    }
  }

  onMouseUp(x, y, event) {
    if (this.state === CbLayer.State.Moving) {
      this.movVal.x = x - this.movStaPos.x;
      this.movVal.y = y - this.movStaPos.y;
      if (this.movVal.x !== 0 || this.movVal.y !== 0) {
        this.rectPositions[0].x += this.movVal.x;
        this.rectPositions[1].x += this.movVal.x;
        this.rectPositions[2].x += this.movVal.x;
        this.rectPositions[3].x += this.movVal.x;
        this.rectPositions[0].y += this.movVal.y;
        this.rectPositions[1].y += this.movVal.y;
        this.rectPositions[2].y += this.movVal.y;
        this.rectPositions[3].y += this.movVal.y;
        this.centerPos.x += this.movVal.x;
        this.centerPos.y += this.movVal.y;
        for (let row = 0; row < this.cbSeats2D.length; row++) {
          for (let col = 0; col < this.cbSeats2D[row].length; col++) {
            this.cbSeats2D[row][col].movePos(this.movVal.x, this.movVal.y);
          }
        }
        for (let row = 0; row < this.musicStands2D.length; row++) {
          for (let col = 0; col < this.musicStands2D[row].length; col++) {
            this.musicStands2D[row][col].movePos(this.movVal.x, this.movVal.y);
          }
        }
        this.update();
      }
      this.state = CbLayer.State.Idle;
    } else if (this.state === CbLayer.State.Rotating) {
      const lenRad = calcLenRadFromPos(
        this.centerPos.x,
        this.centerPos.y,
        x,
        y
      );
      this.rotCurRad = lenRad.radian;
      const radVal = this.rotCurRad - this.rotStaRad;
      if (radVal !== 0) {
        this.rectPositions = this.rotateRect(
          this.rectPositions,
          this.centerPos,
          radVal
        );
        for (let row = 0; row < this.cbSeats2D.length; row++) {
          for (let col = 0; col < this.cbSeats2D[row].length; col++) {
            const [posX, posY] = this.cbSeats2D[row][col].getPos();
            const rotPos = getRotAbsPos(
              posX,
              posY,
              this.centerPos.x,
              this.centerPos.y,
              radVal
            );
            this.cbSeats2D[row][col].changePos(rotPos.x, rotPos.y);
          }
        }
        for (let row = 0; row < this.musicStands2D.length; row++) {
          for (let col = 0; col < this.musicStands2D[row].length; col++) {
            const [posX, posY] = this.musicStands2D[row][col].getPos();
            const rotPos = getRotAbsPos(
              posX,
              posY,
              this.centerPos.x,
              this.centerPos.y,
              radVal
            );
            this.musicStands2D[row][col].changePos(rotPos.x, rotPos.y);
          }
        }
        this.update();
      }
      this.state = CbLayer.State.Idle;
    }
    for (let row = 0; row < this.cbSeats2D.length; row++) {
      for (let col = 0; col < this.cbSeats2D[row].length; col++) {
        this.cbSeats2D[row][col].onMouseUp(x, y, event);
      }
    }
    for (let row = 0; row < this.musicStands2D.length; row++) {
      for (let col = 0; col < this.musicStands2D[row].length; col++) {
        this.musicStands2D[row][col].onMouseUp(x, y, event);
      }
    }
  }

  onMouseOut() {
    this.state = CbLayer.State.Idle;
  }

  draw(ctx, printing = false) {
    if (this.visible === false) {
      return;
    }

    this.drawBG(ctx, printing);

    this.cbSeats2D.flat().forEach((cbSeat) => {
      cbSeat.draw(ctx, printing);
    });
    this.musicStands2D.flat().forEach((musicStand) => {
      musicStand.draw(ctx, printing);
    });
  }

  drawBG(ctx, printing) {
    // 印刷時表示なら描画しない
    if (printing) {
      return;
    }

    ctx.beginPath();
    ctx.setLineDash([1, 3]);
    ctx.strokeStyle = "gray";
    ctx.fillStyle = "white";
    ctx.lineWidth = 1;

    ctx.moveTo(this.rectPositions[0].x, this.rectPositions[0].y);
    ctx.lineTo(this.rectPositions[1].x, this.rectPositions[1].y);
    ctx.lineTo(this.rectPositions[2].x, this.rectPositions[2].y);
    ctx.lineTo(this.rectPositions[3].x, this.rectPositions[3].y);
    ctx.lineTo(this.rectPositions[0].x, this.rectPositions[0].y);
    ctx.stroke();
    //        ctx.fill()

    if (this.state === CbLayer.State.Moving) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgb(100, 76, 76)";
      ctx.lineWidth = 1;
      ctx.moveTo(
        this.rectPositions[0].x + this.movVal.x,
        this.rectPositions[0].y + this.movVal.y
      );
      ctx.lineTo(
        this.rectPositions[1].x + this.movVal.x,
        this.rectPositions[1].y + this.movVal.y
      );
      ctx.lineTo(
        this.rectPositions[2].x + this.movVal.x,
        this.rectPositions[2].y + this.movVal.y
      );
      ctx.lineTo(
        this.rectPositions[3].x + this.movVal.x,
        this.rectPositions[3].y + this.movVal.y
      );
      ctx.lineTo(
        this.rectPositions[0].x + this.movVal.x,
        this.rectPositions[0].y + this.movVal.y
      );
      ctx.stroke();
    } else if (this.state === CbLayer.State.Rotating) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgb(100, 76, 76)";
      ctx.lineWidth = 1;
      const newPositions = this.rotateRect(
        this.rectPositions,
        this.centerPos,
        this.rotCurRad - this.rotStaRad
      );
      ctx.moveTo(newPositions[0].x, newPositions[0].y);
      ctx.lineTo(newPositions[1].x, newPositions[1].y);
      ctx.lineTo(newPositions[2].x, newPositions[2].y);
      ctx.lineTo(newPositions[3].x, newPositions[3].y);
      ctx.lineTo(newPositions[0].x, newPositions[0].y);
      ctx.stroke();
    }
  }
  // rectPositionsをcenterPosを中心にradianぶん回転させたものを戻り値で返す
  rotateRect(rectPositions, centerPos, radian) {
    const newPositions = [];
    rectPositions.forEach((pos) => {
      newPositions.push(
        getRotAbsPos(pos.x, pos.y, centerPos.x, centerPos.y, radian)
      );
    });
    return newPositions;
  }
}

export default CbLayer;
