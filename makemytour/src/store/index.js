import { configureStore, createSlice } from "@reduxjs/toolkit";

const getUserFromLocalStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Error loading user from localStorage:", error);
    return null;
  }
};

const saveUserToLocalStorage = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

const initialState = {
  user: getUserFromLocalStorage(),
};

const userSlice = createSlice({
  name: "user",

  initialState,

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      saveUserToLocalStorage(action.payload);
    },

    clearUser: (state) => {
      state.user = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

export default store;