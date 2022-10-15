import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: { isSidebarOpened: true } };
export const commonDispSlice = createSlice({
  name: "commonDisp",
  initialState,
  reducers: {
    setCommonDisp: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setCommonDisp } = commonDispSlice.actions;
export default commonDispSlice.reducer;
