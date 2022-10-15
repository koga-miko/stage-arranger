import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import recordReducer from "./features/recordSlice";
import commonDispReducer from "./features/commonDispSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    record: recordReducer,
    commonDisp: commonDispReducer,
  },
});
