import React, { useEffect, useState, useRef } from "react";
import { Box, IconButton, TextField } from "@mui/material";
import StaBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import StarIcon from '@mui/icons-material/Star';
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate, useParams } from "react-router-dom";
import recordApi from "../api/recordApi";
import { useDispatch, useSelector } from "react-redux";
import { setRecord } from "../redux/features/recordSlice";
import { setCommonDisp } from "../redux/features/commonDispSlice";
import "./Record.css";
import SeatsArranger from "../components/arrangement_component/SeatsArranger";
import {
  canvasInfo,
  seatsInfo,
} from "../components/arrangement_component/data";
import CommonDialog from "../components/common/CommonDialog";
import LoadingBackdrop from "../components/common/LoadingBackdrop";

const IdSelIdx = {
  Vn1: 0,
  Vn2: 1,
  Vn3: 2,
  Va: 3,
  Vc: 4,
  Cb: 5,
  MaxVal: 6,
};

const DispStateIdx = {
  CbLayer: 0,
  Vn1Label: 1,
  Vn2Label: 2,
  Vn3Label: 3,
  VaLabel: 4,
  VcLabel: 5,
  CbLabel: 6,
  PfImage: 7,
  PrintMode: 8,
  MaxVal: 9,
};

const Record = () => {
  const { recordId } = useParams();
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [description, setDescription] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [timerId, setTimerId] = useState(null);
  const dispatch = useDispatch();
  const records = useSelector((state) => state.record.value);
  const commonDisp = useSelector((state) => state.commonDisp.value);
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const seatsArrangerRef = useRef(null);
  const [dispInfo, setDispInfo] = useState(null);
  const [selectedValues, setSelectedValues] = useState(
    Array(IdSelIdx.MaxVal).fill(0)
  );
  const [dispStates, setDispStates] = useState(
    Array(DispStateIdx.MaxVal).fill(false)
  );
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    seatsArrangerRef.current = new SeatsArranger(
      seatsInfo,
      (dispInfo) => {
        setDispInfo(dispInfo);
      },
      (layoutJSON) => {
        updateLayoutInfo(layoutJSON);
      }
    );
    seatsArrangerRef.current.setCanvas(canvasRef.current);
    renderCanvas();
    return () => {
      seatsArrangerRef.current.end();
      seatsArrangerRef.current = null;
    };
  }, [recordId]);

  const renderCanvas = () => {
    if (seatsArrangerRef.current === null) return;
    seatsArrangerRef.current.draw();
    //  requestAnimationFrame(render);
  };

  useEffect(() => {
    renderCanvas();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getRecord = async () => {
      try {
        setLoading(true);
        const res = await recordApi.getOne(recordId);
        if (isMounted) {
          setTitle(res.title);
          setSubTitle(res.subTitle);
          setDescription(res.description);
          if(res.favorite) {
            setFavorite(true);
          } else {
            setFavorite(false);
          }
          if (res.seatsNumInfo.length > 0) {
            try {
              var newSelectedValues = JSON.parse(res.seatsNumInfo);
              if (newSelectedValues.length === selectedValues.length) {
                setSelectedValues(newSelectedValues);
              } else {
                console.error(
                  `length is not mismatch. selectedValues.length=${selectedValues.length} res.seatsNumInfo=${res.seatsNumInfo}`
                );
              }
            } catch (e) {
              /// エラー時の処理
              console.e("Failed to parse json");
              setSelectedValues(Array(IdSelIdx.MaxVal).fill(0));
              setLoading(false);
              return;
            }
          } else {
            setSelectedValues(Array(IdSelIdx.MaxVal).fill(0));
          }

          const seatsArranger = seatsArrangerRef.current;
          if (seatsArranger !== null) {
            seatsArranger.updateLayout(res.layoutInfo);
            renderCanvas();
          }
        }
      } catch (err) {
        if (isMounted) {
          alert(err);
        }
      } finally {
        setLoading(false);
      }
    };
    getRecord();
    return () => {
      setLoading(false);
      isMounted = false;
    };
  }, [recordId]);

  useEffect(() => {
    console.log(
      `dispatch: setCommonDisp(isSidebarOpened=${!dispStates[
        DispStateIdx.PrintMode
      ]})`
    );
    dispatch(
      setCommonDisp({ isSidebarOpened: !dispStates[DispStateIdx.PrintMode] })
    );
  }, [dispStates, dispatch]);

  // Recodeのデータに所属するdispInfoが更新されたときに表示状態チェックボタンを更新する
  useEffect(() => {
    if (dispInfo === null) return;
    // const DispStateIdx = {
    //   CbLayer: 0,
    //   Vn1Label: 1,
    //   Vn2Label: 2,
    //   Vn3Label: 3,
    //   VaLabel: 4,
    //   VcLabel: 5,
    //   CbLabel: 6,
    //   PfImage: 7,
    //   PrintMode: 8,
    //   MaxVal: 9,
    // };
    const newDispStates = dispStates.slice();

    dispInfo.simplePartsVisibles.forEach((simplePartsVisible) => {
      let filterdItems = DispStateItems.filter((item) => {
        return item.name === simplePartsVisible.name;
      });
      if (filterdItems.length > 0) {
        newDispStates[filterdItems[0].idx] = simplePartsVisible.visible;
      } else {
        if (simplePartsVisible.name === SeatsArranger.cbLayerName) {
          newDispStates[DispStateIdx.CbLayer] = simplePartsVisible.visible;
        }
      }
    });

    newDispStates[DispStateIdx.PrintMode] = false;

    setDispStates(newDispStates);
  }, [dispInfo]);

  useEffect(() => {
    try {
      recordApi.update(recordId, {
        seatsNumInfo: JSON.stringify(selectedValues),
      });
    } catch (err) {
      alert(err);
    }
  }, [selectedValues]);

  const timeout = 500;
  const updateTitle = async (e) => {
    if (timerId !== null) clearTimeout(timerId);
    const newTitle = e.target.value;
    let temp = [...records];
    const index = temp.findIndex((e) => e._id === recordId);
    temp[index] = { ...temp[index], title: newTitle };
    setTitle(newTitle);
    dispatch(setRecord(temp));
    const tempTimerId = setTimeout(async () => {
      setTimerId(null);
      try {
        recordApi.update(recordId, { title: newTitle });
      } catch (err) {
        alert(err);
      }
    }, timeout);
    setTimerId(tempTimerId);
  };

  const updateSubTitle = async (e) => {
    if (timerId !== null) clearTimeout(timerId);
    const newSubTitle = e.target.value;
    let temp = [...records];
    const index = temp.findIndex((e) => e._id === recordId);
    temp[index] = { ...temp[index], subTitle: newSubTitle };
    setSubTitle(newSubTitle);
    dispatch(setRecord(temp));
    const tempTimerId = setTimeout(async () => {
      setTimerId(null);
      try {
        recordApi.update(recordId, { subTitle: newSubTitle });
      } catch (err) {
        alert(err);
      }
    }, timeout);
    setTimerId(tempTimerId);
  };

  const updateDescription = async (e) => {
    if (timerId !== null) clearTimeout(timerId);
    const newDescription = e.target.value;
    setDescription(newDescription);
    const tempTimerId = setTimeout(async () => {
      try {
        setTimerId(null);
        recordApi.update(recordId, { description: newDescription });
      } catch (err) {
        alert(err);
      }
    }, timeout);
    setTimerId(tempTimerId);
  };

  const updateFavorite = async (e) => {
    if (timerId !== null) clearTimeout(timerId);
    const newFavorite = !favorite;
    let temp = [...records];
    const index = temp.findIndex((e) => e._id === recordId);
    temp[index] = { ...temp[index], favorite: newFavorite };
    setFavorite(newFavorite);
    dispatch(setRecord(temp));
    const tempTimerId = setTimeout(async () => {
      try {
        setTimerId(null);
        recordApi.update(recordId, { favorite: newFavorite });
      } catch (err) {
        alert(err);
      }
    }, timeout);
    setTimerId(tempTimerId);
  };

  const updateLayoutInfo = async (updatedLayoutJSON) => {
    if (timerId !== null) clearTimeout(timerId);
    const tempTimerId = setTimeout(async () => {
      try {
        setTimerId(null);
        recordApi.update(recordId, { layoutInfo: updatedLayoutJSON });
      } catch (err) {
        alert(err);
      }
    }, timeout);
    setTimerId(tempTimerId);
  };

  const deleteRecord = async (e) => {
    closeDeleteDialog();
    try {
      await recordApi.delete(recordId);
      const newRecords = records.filter((e) => e._id !== recordId);
      if (newRecords.length === 0) {
        navigate("/record");
      } else {
        navigate(`/record/${newRecords[0]._id}`);
      }
      dispatch(setRecord(newRecords));
    } catch (err) {
      alert(err);
    }
  };

  const copyRecord = async () => {
    try {
      const res = await recordApi.copy(recordId);
      const newRecords = [res, ...records];
      dispatch(setRecord(newRecords));
      navigate(`/record/${res._id}`);
      return;
    } catch (err) {
      alert(err);
    }
  };

  const changePrintModeToOff = () => {
    const newDispStates = dispStates.slice();
    newDispStates[DispStateIdx.PrintMode] = false;
    setDispStates(newDispStates);
    seatsArrangerRef.current.setPrintingMode(
      newDispStates[DispStateIdx.PrintMode]
    );
  };

  const onClick = (x, y, event) => {
    if (seatsArrangerRef.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    seatsArrangerRef.current.onClick(x - rect.x, y - rect.y, event);
    renderCanvas();
  };

  const onDoubleClick = (x, y, event) => {
    if (seatsArrangerRef.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    seatsArrangerRef.current.onDoubleClick(x - rect.x, y - rect.y, event);
    renderCanvas();
  };

  const onMouseDown = (x, y, event) => {
    if (seatsArrangerRef.current === null) return;
    if (dispStates[DispStateIdx.PrintMode] === true) {
      changePrintModeToOff();
    } else {
      const rect = canvasRef.current.getBoundingClientRect();
      seatsArrangerRef.current.onMouseDown(x - rect.x, y - rect.y, event);
    }
    renderCanvas();
  };

  const onMouseMove = (x, y, event) => {
    if (seatsArrangerRef.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    seatsArrangerRef.current.onMouseMove(x - rect.x, y - rect.y, event);
    renderCanvas();
  };

  const onMouseUp = (x, y, event) => {
    if (seatsArrangerRef.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    seatsArrangerRef.current.onMouseUp(x - rect.x, y - rect.y, event);
    renderCanvas();
  };

  const onMouseOut = (event) => {
    if (seatsArrangerRef.current === null) return;
    seatsArrangerRef.current.onMouseOut(event);
    renderCanvas();
  };

  const onKeyDown = (event) => {
    if (seatsArrangerRef.current === null) return;
    seatsArrangerRef.current.onKeyDown(event);
    renderCanvas();
  };

  const onKeyUp = (event) => {
    if (seatsArrangerRef.current === null) return;
    seatsArrangerRef.current.onKeyUp(event);
    renderCanvas();
  };

  const handleSelectChange = (e, idSelIdx) => {
    const newSelectedValues = selectedValues.slice();
    newSelectedValues[idSelIdx] = e.target.value;
    setSelectedValues(newSelectedValues);
  };
  const handleDispStateChanged = (e, dispStateIdx) => {
    if (seatsArrangerRef.current === null) return;
    const newDispStates = dispStates.slice();
    newDispStates[dispStateIdx] = e.target.checked;
    setDispStates(newDispStates);
    if (dispStateIdx === DispStateIdx.CbLayer) {
      seatsArrangerRef.current.setCbLayerVisible(newDispStates[dispStateIdx]);
    } else if (dispStateIdx === DispStateIdx.PrintMode) {
      seatsArrangerRef.current.setPrintingMode(newDispStates[dispStateIdx]);
    } else {
      seatsArrangerRef.current.setSimplePartsVisible(
        e.target.name,
        newDispStates[dispStateIdx]
      );
    }
    renderCanvas();
  };

  const renderIdSelect = (idSelIdx) => {
    return (
      <div className="cp_ipselect cp_sl01">
        <select
          onChange={(e) => handleSelectChange(e, idSelIdx)}
          value={selectedValues[idSelIdx].toString()}
        >
          <option value="0">-</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
        </select>
      </div>
    );
  };

  const DispStateItems = [
    {
      idx: DispStateIdx.PrintMode,
      id: "print-mode-disp",
      name: "Print-disp",
      text: "印刷用表示",
    },
    {
      idx: DispStateIdx.CbLayer,
      id: "cb-layer-disp",
      name: "Cb-layer",
      text: "Cb座席表示",
    },
    {
      idx: DispStateIdx.Vn1Label,
      id: "vn1-label-disp",
      name: "Vn1-label",
      text: "Vn1ラベル表示",
    },
    {
      idx: DispStateIdx.Vn2Label,
      id: "vn2-label-disp",
      name: "Vn2-label",
      text: "Vn2ラベル表示",
    },
    {
      idx: DispStateIdx.Vn3Label,
      id: "vn3-label-disp",
      name: "Vn3-label",
      text: "Vn3ラベル表示",
    },
    {
      idx: DispStateIdx.VaLabel,
      id: "va-label-disp",
      name: "Va-label",
      text: "Vaラベル表示",
    },
    {
      idx: DispStateIdx.VcLabel,
      id: "vc-label-disp",
      name: "Vc-label",
      text: "Vcラベル表示",
    },
    {
      idx: DispStateIdx.CbLabel,
      id: "cb-label-disp",
      name: "Cb-label",
      text: "Cbラベル表示",
    },
    {
      idx: DispStateIdx.PfImage,
      id: "pf-image-disp",
      name: "Pf-image",
      text: "ピアノ表示",
    },
  ];

  const renderDispStateChecks = () => {
    return (
      <div className="on-off-btn_wrap">
        {DispStateItems.filter(
          (item) => dispStates[DispStateIdx.PrintMode] === false
        ).map((item, idx) => {
          return (
            <div className="disp-state-btn-item" key={idx}>
              <input
                type="checkbox"
                onChange={(e) => handleDispStateChanged(e, item.idx)}
                checked={dispStates[item.idx]}
                name={item.name}
                id={item.id}
              />
              <label htmlFor={item.id}>{item.text}</label>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupNumbersInTable = () => {
    if (dispStates[DispStateIdx.PrintMode] === false) {
      return (
        <tr>
          <th>グループ番号</th>
          <td>{renderIdSelect(IdSelIdx.Vn1)}</td>
          <td>{renderIdSelect(IdSelIdx.Vn2)}</td>
          <td>{renderIdSelect(IdSelIdx.Vn3)}</td>
          <td>{renderIdSelect(IdSelIdx.Va)}</td>
          <td>{renderIdSelect(IdSelIdx.Vc)}</td>
          <td>10</td>
          <td>-</td>
        </tr>
      );
    }
    return;
  };

  const renderPartNamesInTable = (idSelIdx, partName) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        dispStates[DispStateIdx.CbLayer] === false
      ) {
        return;
      } else {
        return <th>{partName}</th>;
      }
    } else {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        selectedValues[idSelIdx] === 0
      ) {
        return;
      } else {
        return <th>{partName}</th>;
      }
    }
  };

  const renderNumsOfSeatsInTable = (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        dispStates[DispStateIdx.CbLayer] === false
      ) {
        return;
      } else {
        return <td>0</td>;
      }
    } else {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        selectedValues[idSelIdx] === 0
      ) {
        return;
      } else {
        return (
          <td>
            {dispInfo === null
              ? 0
              : dispInfo.numOfSeats[selectedValues[idSelIdx]]}
          </td>
        );
      }
    }
  };

  const renderNumsOfPianoSeatsInTable = (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        dispStates[DispStateIdx.CbLayer] === false
      ) {
        return;
      } else {
        return <td>0</td>;
      }
    } else {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        selectedValues[idSelIdx] === 0
      ) {
        return;
      } else {
        return (
          <td>
            {dispInfo === null
              ? 0
              : dispInfo.numOfPianoSeats[selectedValues[idSelIdx]]}
          </td>
        );
      }
    }
  };

  const renderNumsOfPersonsInTable = (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        dispStates[DispStateIdx.CbLayer] === false
      ) {
        return;
      } else {
        return <td>{dispInfo === null ? 0 : dispInfo.numOfPersons[10]}</td>;
      }
    } else {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        selectedValues[idSelIdx] === 0
      ) {
        return;
      } else {
        return (
          <td>
            {dispInfo === null
              ? 0
              : dispInfo.numOfPersons[selectedValues[idSelIdx]]}
          </td>
        );
      }
    }
  };

  const renderNumsOfStandsInTable = (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        dispStates[DispStateIdx.CbLayer] === false
      ) {
        return;
      } else {
        return <td>{dispInfo === null ? 0 : dispInfo.numOfStands[10]}</td>;
      }
    } else {
      if (
        dispStates[DispStateIdx.PrintMode] === true &&
        selectedValues[idSelIdx] === 0
      ) {
        return;
      } else {
        return (
          <td>
            {dispInfo === null
              ? 0
              : dispInfo.numOfStands[selectedValues[idSelIdx]]}
          </td>
        );
      }
    }
  };

  const renderTableDisp = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>パート</th>
            {renderPartNamesInTable(IdSelIdx.Vn1, "Vn1")}
            {renderPartNamesInTable(IdSelIdx.Vn2, "Vn2")}
            {renderPartNamesInTable(IdSelIdx.Vn3, "Vn3")}
            {renderPartNamesInTable(IdSelIdx.Va, "Va")}
            {renderPartNamesInTable(IdSelIdx.Vc, "Vc")}
            {renderPartNamesInTable(IdSelIdx.Cb, "Cb")}
            <th>合計</th>
          </tr>
        </thead>
        <tbody>
          {renderGroupNumbersInTable()}
          <tr>
            <th>標準の座席数</th>
            {renderNumsOfSeatsInTable(IdSelIdx.Vn1)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vn2)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vn3)}
            {renderNumsOfSeatsInTable(IdSelIdx.Va)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vc)}
            {renderNumsOfSeatsInTable(IdSelIdx.Cb)}
            <td>{dispInfo === null ? 0 : dispInfo.numOfSeats.all}</td>
          </tr>
          <tr>
            <th>ピアノ座席数</th>
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn1)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn2)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn3)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Va)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vc)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Cb)}
            <td>{dispInfo === null ? 0 : dispInfo.numOfPianoSeats.all}</td>
          </tr>
          <tr>
            <th>人数</th>
            {renderNumsOfPersonsInTable(IdSelIdx.Vn1)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vn2)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vn3)}
            {renderNumsOfPersonsInTable(IdSelIdx.Va)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vc)}
            {renderNumsOfPersonsInTable(IdSelIdx.Cb)}
            <td>{dispInfo === null ? 0 : dispInfo.numOfPersons.all}</td>
          </tr>
          <tr>
            <th>譜面台個数</th>
            {renderNumsOfStandsInTable(IdSelIdx.Vn1)}
            {renderNumsOfStandsInTable(IdSelIdx.Vn2)}
            {renderNumsOfStandsInTable(IdSelIdx.Vn3)}
            {renderNumsOfStandsInTable(IdSelIdx.Va)}
            {renderNumsOfStandsInTable(IdSelIdx.Vc)}
            {renderNumsOfStandsInTable(IdSelIdx.Cb)}
            <td>{dispInfo === null ? 0 : dispInfo.numOfStands.all}</td>
          </tr>
        </tbody>
      </table>
    );
  };
  // numInfoオブジェクトの中身は、{numOfSeats: {1:xxx, 2:xxx,...}, numOfStands: {1:xxx, 2:xxx,...} }

  const openDeleteDialog = () => {
    setIsOpenDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setIsOpenDeleteDialog(false);
  };

  const renderStarIcon = () => {
    if (favorite) {
      return <StarIcon color="warning"/>
    } else {
      return <StaBorderOutlinedIcon />
    }
  }
  const renderTopIcons = () => {
    if (commonDisp.isSidebarOpened) {
      return (
        <div>
          <IconButton onClick={updateFavorite}>
            {renderStarIcon()}
          </IconButton>
          <IconButton variant="outlined" onClick={copyRecord}>
            <ContentCopyIcon />
          </IconButton>
          <IconButton
            variant="outlined"
            color="error"
            onClick={openDeleteDialog}
          >
            <DeleteOutlinedIcon />
          </IconButton>
        </div>
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      <LoadingBackdrop isOpen={loading} />
      <Box
        sx={{
          display: "flex",
          alignItem: "center",
          width: "100",
        }}
      >
        {renderTopIcons()}
        <CommonDialog
          msg={"削除しますか？（続行するとデータは完全に削除されます）"}
          isOpen={isOpenDeleteDialog}
          doYes={deleteRecord}
          doNo={() => {
            setIsOpenDeleteDialog(false);
          }}
        />
      </Box>
      <Box sx={{ padding: "10px 50px" }}>
        <Box>
          <TextField
            onChange={updateTitle}
            value={title}
            placeholder={commonDisp.isSidebarOpened ? "無題" : ""}
            variant="outlined"
            fullWidth
            sx={{
              ".MuiOutlinedInput-input": { padding: 0 },
              ".MuiOutlinedInput-notchedOutline": { border: "None" },
              ".MuiOutlinedInput-root": { fontSize: "2rem", fontWeight: "700" },
            }}
          />
          <TextField
            onChange={updateSubTitle}
            value={subTitle}
            placeholder={commonDisp.isSidebarOpened ? "サブタイトル" : ""}
            variant="outlined"
            fullWidth
            sx={{
              ".MuiOutlinedInput-input": { padding: 0 },
              ".MuiOutlinedInput-notchedOutline": { border: "None" },
              ".MuiOutlinedInput-root": {
                fontSize: "1.5rem",
                fontWeight: "700",
              },
            }}
          />
          <TextField
            onChange={updateDescription}
            value={description}
            placeholder={commonDisp.isSidebarOpened ? "説明" : ""}
            variant="outlined"
            fullWidth
            sx={{
              ".MuiOutlinedInput-input": { padding: 0 },
              ".MuiOutlinedInput-notchedOutline": { border: "None" },
              ".MuiOutlinedInput-root": { fontSize: "1rem" },
            }}
          />
          <div className="ArrangementComponent">
            <div>
              <canvas
                id="stage"
                tabIndex="0"
                onClick={(event) =>
                  onClick(event.clientX, event.clientY, event)
                }
                onDoubleClick={(event) =>
                  onDoubleClick(event.clientX, event.clientY, event)
                }
                onMouseDown={(event) =>
                  onMouseDown(event.clientX, event.clientY, event)
                }
                onMouseMove={(event) =>
                  onMouseMove(event.clientX, event.clientY, event)
                }
                onMouseUp={(event) =>
                  onMouseUp(event.clientX, event.clientY, event)
                }
                onMouseOut={(event) => onMouseOut(event)}
                onKeyDown={(event) => onKeyDown(event)}
                onKeyUp={(event) => onKeyUp(event)}
                ref={canvasRef}
                height={canvasInfo.h}
                width={canvasInfo.w}
              />
            </div>
            {renderDispStateChecks()}
            {renderTableDisp()}
          </div>
        </Box>
      </Box>
    </>
  );
};

export default Record;
