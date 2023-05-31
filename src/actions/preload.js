import store from "../reducers";
import { changeTheme } from "./";
import supabase from "../supabase/createClient";

const loadSettings = async () => {
  let sett = JSON.parse("[]"); // TODO setting from database

  if (sett.person == null) {
    sett = JSON.parse(JSON.stringify(store.getState().setting));
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      sett.person.theme = "dark";
    }
  }

  if (sett.person.theme != "light")  
    changeTheme();

  store.dispatch({ type: "SETTLOAD", payload: sett });
  if (import.meta.env.MODE != "development") {
    loadWidget();
  }
};

const loadApp = async () => {

  // const updateApp = async () => {
  //   const { data, error } = await supabase
  //     .from("user_profile")
  //     .select("metadata->installed_app");
  //   if (error != null) throw error;

  //   const apps = data.at(0).installed_app ?? [];
  //   apps.forEach((val) => {
  //     store.dispatch({ type: "DESKADD", payload: val });
  //   });
  // };


}


const loadUser = async () => {
      
  const { data, error } = await supabase.auth.getUser();
  if (error != null) 
    throw error;

  store.dispatch({ 
    type: "ADD_USER", 
    payload: data.user 
  });
}


export const preload = async () => {
  await Promise.all([
    loadSettings(),
    loadApp(),
    loadUser()])
}