import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import store from "./reducers";
import "./i18nextConf";
import "./index.css";
import ReactGA from "react-ga";

import ActMenu from "./components/menu";
import {
  BandPane,
  CalnWid,
  DesktopApp,
  SidePane,
  StartMenu,
  WidPane,
} from "./components/start";
import Taskbar from "./components/taskbar";
import { Background } from "./containers/background";

import { loadSettings } from "./actions";
import * as Applications from "./containers/applications";
import * as Drafts from "./containers/applications/draft";
import supabase from "./supabase/createClient";
import { LockScreen, BootScreen } from "./containers/background";
import ReactModal from "react-modal";
import { combineText } from "./utils/combineText";
import { Image } from "./utils/general";

const TRACKING_ID = "G-C772WT3BD0";
ReactGA.initialize(TRACKING_ID);

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <meta charSet="UTF-8" />
      <title>404 - Page</title>
      <script src="https://win11.blueedge.me/script.js"></script>
      <link rel="stylesheet" href="https://win11.blueedge.me/style.css" />
      {/* partial:index.partial.html */}
      <div id="page">
        <div id="container">
          <h1>:(</h1>
          <h2>
            Your PC ran into a problem and needs to restart. We're just
            collecting some error info, and then we'll restart for you.
          </h2>
          <h2>
            <span id="percentage">0</span>% complete
          </h2>
          <div id="details">
            <div id="qr">
              <div id="image">
                <img src="https://win11.blueedge.me/img/qr.png" alt="QR Code" />
              </div>
            </div>
            <div id="stopcode">
              <h4>
                For more information about this issue and possible fixes, visit
                <br />{" "}
                <a href="https://github.com/blueedgetechno/win11React/issues">
                  https://github.com/blueedgetechno/win11React/issues
                </a>{" "}
              </h4>
              <h5>
                If you call a support person, give them this info:
                <br />
                Stop Code: {error.message}
              </h5>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          </div>
        </div>
      </div>
      {/* partial */}
    </div>
  );
}

function App() {
  const apps = useSelector((state) => state.apps);
  const wall = useSelector((state) => state.wallpaper);
  const user = useSelector((state) => state.user);
  ReactModal.setAppElement("#root");
  // const urlParams = new URLSearchParams(window.location.search);
  const modalInfo = useSelector((state) => state.modal);
  const dispatch = useDispatch();

  const afterMath = (event) => {
    var ess = [
      ["START", "STARTHID"],
      ["BAND", "BANDHIDE"],
      ["PANE", "PANEHIDE"],
      ["WIDG", "WIDGHIDE"],
      ["CALN", "CALNHIDE"],
      ["MENU", "MENUHIDE"],
    ];

    var actionType = "";
    try {
      actionType = event.target.dataset.action || "";
    } catch (err) {}

    var actionType0 = getComputedStyle(event.target).getPropertyValue(
      "--prefix"
    );

    ess.forEach((item, i) => {
      if (!actionType.startsWith(item[0]) && !actionType0.startsWith(item[0])) {
        dispatch({
          type: item[1],
        });
      }
    });
  };

  window.oncontextmenu = (e) => {
    afterMath(e);
    e.preventDefault();
    // dispatch({ type: 'GARBAGE'});
    var data = {
      top: e.clientY,
      left: e.clientX,
    };

    if (e.target.dataset.menu != null) {
      data.menu = e.target.dataset.menu;
      data.attr = e.target.attributes;
      data.dataset = e.target.dataset;
      dispatch({
        type: "MENUSHOW",
        payload: data,
      });
    }
  };

  window.onclick = afterMath;

  window.onload = (e) => {
    dispatch({ type: "WALLBOOTED" });
  };

  const updateApp = async () => {
    const { data, error } = await supabase
      .from("user_profile")
      .select("metadata->installed_app");
    if (error != null) throw error;

    const apps = data.at(0).installed_app ?? [];
    apps.forEach((val) => {
      store.dispatch({ type: "DESKADD", payload: val });
    });
  };

  useEffect(() => {
    if (!window.onstart) {
      loadSettings();
      updateApp();
      window.onstart = setTimeout(() => {
        // console.log("prematurely loading ( ﾉ ﾟｰﾟ)ﾉ");
        dispatch({ type: "WALLBOOTED" });
      }, 5000);
    }
  });

  const verifyUserInfo = React.useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error !== null) {
      throw error;
    }
    dispatch({ type: "ADD_USER", payload: data.user });
  }, [dispatch]);

  useEffect(() => {
    verifyUserInfo();
  }, [verifyUserInfo]);

  // GG analytics
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  return (
    <div className="App">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {!wall.booted ? <BootScreen dir={wall.dir} /> : null}
        {wall.locked === true || !user?.id ? (
          <LockScreen dir={wall.dir} />
        ) : null}
        <div className="appwrap">
          <Background />
          {
            //user => render
            user.id ? (
              <>
                <div className="desktop" data-menu="desk">
                  <DesktopApp />
                  {Object.keys(Applications).map((key, idx) => {
                    var WinApp = Applications[key];
                    return <WinApp key={idx} />;
                  })}
                  {Object.keys(apps)
                    .filter((x) => x != "hz")
                    .map((key) => apps[key])
                    .map((app, i) => {
                      if (app.pwa) {
                        var WinApp = Drafts[app.data.type];
                        return <WinApp key={i} icon={app.icon} {...app.data} />;
                      }
                    })}
                  <StartMenu />
                  <BandPane />
                  <SidePane />
                  <WidPane />
                  <CalnWid />
                </div>
                <Taskbar />
                <ActMenu />
                <Modal
                  isOpen={isModalOpen}
                  closeModal={async () => {
                    await updateStoreContent();
                    setModalOpen(false);
                  }}
                >
                  {
                    modalInfo.type == 'insert_store' 
                    ?  (<ModalEditOrInsert
                        modalType={"insert"}
                        closeModal={async () => {
                          await updateStoreContent();
                          setModalOpen(false);
                        }}
                      />)
                    : modalInfo.type == 'edit_store' 
                    ?  (<ModalEditOrInsert
                        modalType={"edit"}
                        appData={appData}
                        closeModal={async () => {
                          setModalAdminOpen(false);
                          await update();
                        }}
                      />)
                    : modalInfo.type == 'edit_store' 
                    ? (<ModalWorkerInfo data={modalInfo.data} />)
                    : null
                  }
                </Modal>
              </>
            ) : null
          }
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default App;
