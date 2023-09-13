import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import "./App.css";
import {
  CometChatConversationsWithMessages,
  CometChatUIKit,
} from "@cometchat/chat-uikit-react";
import { useEffect, useRef, useState } from "react";
// import Login from "./login/Login";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatIncomingCall } from "@cometchat/chat-uikit-react";
import { CometChatMessages } from "@cometchat/chat-uikit-react";

import { CometChatCalls } from "@cometchat/calls-sdk-javascript";
import { useQueryParams } from "./Test";
import { Login } from "./components/Login";
import { IsMobileViewContext } from "./IsMobileViewContext";
import { Signup } from "./components/Signup";
// import { loadingModalStyle } from "./style";
import LoadingIconGif from "../src/assets/loading_icon.gif";

function App() {
  const queryParams: any = useQueryParams();
  let { uid, callType, guid, sessionid, receiverType } = queryParams;
  const [isMobileView, setIsMobileView] = useState(false);

  const [interestingAsyncOpStarted, setInterestingAsyncOpStarted] =
    useState(false);
  const [loggedInUser, setLoggedInUser] = useState<
    CometChat.User | null | undefined
  >();
  const [chatWithUser, setChatWithUser] = useState(null);
  const [chatWithGroup, setChatWithGroup] = useState(null);

  const [callObject, setCallObject] = useState(null);
  const [homeSessionId, setHomeSessionId] = useState(null);
  const navigate = useNavigate();
  const myElementRef = useRef(null);
  const refCount = useRef(0);
  // let isCallEnded = false;

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) setIsMobileView(true);
      else setIsMobileView(false);
    }
    window.addEventListener("resize", handleResize);
  }, [setIsMobileView]);

  useEffect(() => {
    if (uid && callType && receiverType) {
      var call: any = new CometChat.Call(uid, callType, receiverType);
      if (call) {
        setCallObject(call);
      }
    }

    return () => {
      setCallObject(null);
    };
  }, [uid, callType, receiverType]);

  const acceptCall = async (sessionid: any) => {
    await CometChat.acceptCall(sessionid).then(
      async (call: any) => {
        setCallObject(null);
        console.log(
          "Call @cometchat/chat-sdk-javascriptaccepted successfully:",
          call
        );
        let CurrentSessionId = call.sessionId;
        const authToken = await loggedInUser?.getAuthToken()!;
        let callToken = await CometChatCalls.generateToken(
          CurrentSessionId,
          authToken
        );
        let isAudioOnly = callType === "audio" || call.type === "audio";
        const callSettings = new CometChatCalls.CallSettingsBuilder()
          .enableDefaultLayout(true)
          .setIsAudioOnlyCall(isAudioOnly)
          .setCallListener(
            new CometChatCalls.OngoingCallListener({
              onUserListUpdated: (userList: any) => {
                console.log("user list:", userList);
              },

              onCallEndButtonPressed: () => {
                CometChatCalls.endSession();
                CometChat.endCall(CurrentSessionId);
                if (window.location.href !== "/") {
                  navigate({
                    pathname: "/",
                  });
                }
              },
              onCallEnded: () => {
                console.log("Call ended");
                // if (isCallEnded) {
                console.log("clilcked in on");
                CometChatCalls.endSession();
                CometChat.endCall(CurrentSessionId);
                if (window.location.href !== "http://localhost:3000/") {
                  navigate({
                    pathname: "/",
                  });
                }
              },

              onError: (error: any) => {
                console.log("Error :", error);
              },
              onMediaDeviceListUpdated: (deviceList: any) => {
                console.log("Device List:", deviceList);
              },
              onUserMuted: (event: any) => {
                // This event will work in JS SDK v3.0.2-beta1 & later.
                console.log("Listener => onUserMuted:", {
                  userMuted: event.muted,
                  userMutedBy: event.mutedBy,
                });
              },
              onScreenShareStarted: () => {
                // This event will work in JS SDK v3.0.3 & later.
                console.log("Screen sharing started.");
              },
              onScreenShareStopped: () => {
                // This event will work in JS SDK v3.0.3 & later.
                console.log("Screen sharing stopped.");
              },
              onCallSwitchedToVideo: (event: any) => {
                // This event will work in JS SDK v3.0.8 & later.
                console.log("call switched to video:", {
                  sessionId: event.sessionId,
                  callSwitchInitiatedBy: event.initiator,
                  callSwitchAcceptedBy: event.responder,
                });
              },
              onUserJoined: (user: any) =>
                console.log("event => onUserJoined", user),
              onUserLeft: (user: any) => {
                console.log("event => onUserLeft", user);
              },
            })
          )
          .build();

        const htmlElement = myElementRef.current;
        CometChatCalls.startSession(callToken.token, callSettings, htmlElement!)
          .then((response: any) => {
            console.log("call session success", response);
          })
          .catch((error: any) => {
            console.log("call session failure", error);
          });
      },
      (error: any) => {
        console.log("Call acceptance failed with error", error);
      }
    );
  };

  useEffect(() => {
    var listnerID = "UNIQUE_LISTENER_ID";

    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: any) => {
          console.log("Incoming call:", call);
          setHomeSessionId(call.sessionId);
          // setHomeCallType(call.type);
          setCallObject(call);
        },
        onOutgoingCallAccepted: (call: any) => {
          console.log("Outgoing call accepted:", call);
        },
        onOutgoingCallRejected: (call: any) => {
          console.log("Outgoing call rejected:", call);
        },
        onIncomingCallCancelled: (call: any) => {
          console.log("Incoming call calcelled:", call);
        },
        onCallEndedMessageReceived: (call: any) => {
          console.log("CallEnded Message:", call);
        },
      })
    );

    return () => {
      CometChat.removeCallListener(sessionid);
      CometChatCalls.removeCallEventListener(sessionid);
      refCount.current = 0;
    };
  }, [sessionid]);
  const cancelCall = async (sessionid: any) => {
    // setCallObject(undefined);
    console.log("rejected?????????????????????????????????????????");
    var status = CometChat.CALL_STATUS.REJECTED;
    setCallObject(null);

    CometChat.rejectCall(sessionid, status).then(
      (call: any) => {
        console.log("Call rejected successfully", call);
      },
      (error: any) => {
        console.log("Call rejection failed with error:", error);
      }
    );
  };

  useEffect(() => {
    if (guid && !uid) {
      CometChat.getGroup(guid)
        .then((group: any) => {
          if ("guid" in group) {
            setChatWithGroup(group);
          }
        })
        .catch((group: any) => {
          console.log("group does not exit", group);
        });
    }

    if (uid && !guid) {
      CometChat.getUser(uid)
        .then((user: any) => {
          if ("uid" in user) {
            setChatWithUser(user);
          }
        })
        .catch((user: any) => {
          console.log("user does not exit", user);
        });
    }
  }, [guid, uid]);

  useEffect(() => {
    (async () => {
      try {
        setLoggedInUser(await CometChat.getLoggedinUser());
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  const logout = () => {
    CometChatUIKit.logout()!.then(
      () => {
        //Logout completed successfully
        console.log("Logout completed successfully");
        setLoggedInUser(null);
      },
      (error: any) => {
        //Logout failed with exception
        console.log("Logout failed with exception:", { error });
      }
    );
  };

  function IncrementCount() {
    refCount.current = refCount.current + 1;
  }

  function getChatsModule() {
    return (
      <>
        <div
          style={{ height: "100vh" }}
          ref={myElementRef}
          id='ELEMENT_ID'
          key='chatPage'
        >
          {chatWithGroup ? (
            <>
              <CometChatMessages group={chatWithGroup} key={guid} />

              {callObject && (
                <CometChatIncomingCall
                  call={callObject}
                  onAccept={() => acceptCall(sessionid)}
                />
              )}
            </>
          ) : (
            <>
              {chatWithUser && (
                <CometChatMessages user={chatWithUser} key={uid} />
              )}
              {callObject && (
                <CometChatIncomingCall
                  call={callObject}
                  onAccept={() => acceptCall(sessionid)}
                  onDecline={() => {
                    IncrementCount();

                    if (refCount.current > 2) {
                      cancelCall(sessionid);
                    }
                  }}
                />
              )}
            </>
          )}
        </div>
      </>
    );
  }
  function getSignup() {
    return (
      <Signup
        loggedInUser={loggedInUser}
        setLoggedInUser={setLoggedInUser}
        setInterestingAsyncOpStarted={setInterestingAsyncOpStarted}
      />
    );
  }
  // function getLoadingModal() {
  //   return (
  //     <div style={loadingModalStyle(interestingAsyncOpStarted)}>
  //       <div
  //         style={{
  //           padding: "16px",
  //           borderRadius: "8px",
  //           backgroundColor: "white",
  //           display: "flex",
  //           flexDirection: "column",
  //           justifyContent: "center",
  //           alignItems: "center",
  //           rowGap: "8px",
  //         }}
  //       >
  //         <img
  //           src={CometChatLogo}
  //           alt='CometChat logo'
  //           style={{
  //             width: "240px",
  //             height: "240px",
  //           }}
  //         />
  //         <img src={LoadingIconGif} alt='Laoding icon' />
  //       </div>
  //     </div>
  //   );
  // }

  function getHome() {
    return (
      <>
        <div
          className='App'
          style={{ height: "100vh" }}
          ref={myElementRef}
          id='ELEMENT_ID'
          key='homePage'
        >
          {loggedInUser ? (
            <>
              <button onClick={() => logout()}>Logout</button>

              <CometChatConversationsWithMessages key='homePageCometChatConversationsWithMessages' />
              {callObject && (
                <CometChatIncomingCall
                  call={callObject}
                  onAccept={() => acceptCall(homeSessionId)}
                />
              )}
            </>
          ) : (
            <Login
              loggedInUser={loggedInUser}
              setLoggedInUser={setLoggedInUser}
              setInterestingAsyncOpStarted={setInterestingAsyncOpStarted}
            />
          )}
        </div>
      </>
    );
  }
  return (
    <div>
      <IsMobileViewContext.Provider value={isMobileView}>
        <Routes>
          <Route path='/'>
            <Route path='/' element={getHome()}></Route>
            <Route path='signup' element={getSignup()} />

            <Route path='chats' element={getChatsModule()} />
          </Route>
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </IsMobileViewContext.Provider>

      {/* {getLoadingModal()} */}
    </div>
  );
}

export default App;
