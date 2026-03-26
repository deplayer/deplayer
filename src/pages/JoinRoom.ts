import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as types from "../constants/ActionTypes";
import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";

const JoinRoom = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appReady = useUIStore(s => s.ready);

  useEffect(() => {
    if (id && appReady) {
      const username = localStorage.getItem("username") || "Anonymous";
      dispatch({
        type: types.JOIN_PEER_ROOM,
        roomCode: id,
        username,
      });

      // Open the right panel to show the social section
      dispatch({ type: types.TOGGLE_RIGHT_PANEL, value: true });

      // Redirect to dashboard after joining
      navigate("/");
    }
  }, [id, dispatch, navigate, appReady]);

  return null;
};

export default JoinRoom;
