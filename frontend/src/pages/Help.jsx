import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

function createData(target, operation, behavior) {
  return { target, operation, behavior };
}

const basicRows = [
  createData(
    "無し ※オブジェクトのない位置",
    "マウス左押し + カーソル移動",
    "分割線を挿入する ※座席と座席の間をなぞっていく必要あり"
  ),
  createData(
    "無し ※オブジェクトのない位置",
    "Ctrl + マウス左押し + カーソル移動",
    "破線矩形でオブジェクト(座席 or 分割線)を選択状態にする"
  ),
  createData(
    "座席(〇)",
    "マウス左クリック",
    "座席の種類【標準】を順次切り替える（通常 → 空席 → 無し → ...の繰り返し）"
  ),
  createData(
    "座席(〇)",
    "マウス左長押し + カーソル移動無し",
    "座席の種類【特別】を順次切り替える（通常赤丸 → 空席赤丸 → ピアノ椅子 → ...の繰り返し）"
  ),
  createData("座席(〇)", "マウス左長押し + カーソル移動有り", "位置調整"),
  createData(
    "座席(〇)",
    "Ctrl + マウス左クリック",
    "座席の選択／非選択状態を切り替える"
  ),
  createData(
    "譜面台(x)",
    "マウス左クリック",
    "譜面台の状態を変更する（通常 → 無し → ...の繰り返し）※その後座席の状態変更で譜面台の状態はクリアされる"
  ),
  createData(
    "譜面台(x)",
    "マウス左長押し + カーソル移動無し",
    "譜面台を特別な赤枠状態へ変更する ※その後座席の状態変更で譜面台の状態はクリアされる"
  ),
  createData("譜面台(x)", "マウス左長押し + カーソル移動有り", "位置調整"),
  createData(
    "分割線(|)",
    "Ctrl + マウス左クリック",
    "分割線の選択／非選択状態を切り替える"
  ),
  createData(
    "コントラバス(□)",
    "マウス左クリック",
    "コントラバスの状態を変更する（通常 or 無し）"
  ),
  createData(
    "コントラバス(□)",
    "マウス左長押し + カーソル移動",
    "コントラバスの位置を調整する"
  ),
  createData(
    "コントラバス群(□)の破線外枠",
    "マウス左押し + カーソル移動",
    "コントラバス群の位置を調整する"
  ),
  createData(
    "コントラバス群(□)の破線外枠",
    "Ctrl + マウス左押し + カーソル移動",
    "コントラバス群の角度を調整する"
  ),
  createData(
    "ラベル(ピアノ or 各種楽器名)",
    "マウス左押し + カーソル移動",
    "ラベルの位置を調整する"
  ),
];

const RowsForSelectedObj = [
  createData(
    "座席(〇)",
    "Ctrl + Space キー押下",
    "座席の種類【標準・特別】の切り替え（通常 → 空席 → 無し → 通常赤丸 → 空席赤丸 → ピアノ椅子 → ...の繰り返し）"
  ),
  createData("座席(〇)", "1 ～ 9 のいずれかのキー", "座席の番号の変更"),
  createData("座席(〇)", "nキー押下", "座席の種類を通常に設定"),
  createData("座席(〇)", "dキー押下", "座席の種類を二重丸に設定"),
  createData("座席(〇)", "rキー押下", "座席の種類を通常非赤丸に設定"),
  createData(
    "座席(〇)",
    "R(Shift + r)キー押下",
    "座席の種類を空席非赤丸に設定"
  ),
  createData(
    "座席(〇)",
    "BSキー もしくは DELキー押下",
    "座席は状態を無しに設定・分割線は消去"
  ),
  createData(
    "任意のオブジェクト",
    "ESCキー押下",
    "すべてのオブジェクトの選択状態を解除"
  ),
  createData(
    "任意のオブジェクト",
    "オブジェクトの無い位置でマウス左クリック",
    "すべてのオブジェクトの選択状態を解除"
  ),
];

const Help = () => {
  return (
    <div>
      <h2>Stage Arranger 操作方法一覧</h2>
      <h3>・基本操作</h3>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "20%" }}>対象オブジェクト</TableCell>
              <TableCell sx={{ width: "20%" }}>操作</TableCell>
              <TableCell sx={{ width: "60%" }}>機能</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {basicRows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ width: "20%" }}>
                  {row.target}
                </TableCell>
                <TableCell sx={{ width: "20%" }}>{row.operation}</TableCell>
                <TableCell sx={{ width: "60%" }}>{row.behavior}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ paddingTop: "30px" }}></Box>

      <h3>・選択状態にあるオブジェクトへの一括操作</h3>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "20%" }}>対象オブジェクト</TableCell>
              <TableCell sx={{ width: "20%" }}>操作</TableCell>
              <TableCell sx={{ width: "60%" }}>機能</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {RowsForSelectedObj.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ width: "20%" }}>
                  {row.target}
                </TableCell>
                <TableCell sx={{ width: "20%" }}>{row.operation}</TableCell>
                <TableCell sx={{ width: "60%" }}>{row.behavior}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Help;
