import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ITable } from "@/types/tableTypes";

interface TablesState {
  tables: ITable[];
}

const initialState: TablesState = {
  tables: [],
};

const tablesSlice = createSlice({
  name: "tables",
  initialState,
  reducers: {
    setTables: (state, action: PayloadAction<ITable[]>) => {
      state.tables = action.payload;
    },
  },
});

export const { setTables } = tablesSlice.actions;
export default tablesSlice.reducer;
