import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: [] };
export const recordSlice = createSlice({
  name: "record",
  initialState,
  reducers: {
    setRecord: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setRecord } = recordSlice.actions;
export default recordSlice.reducer;
