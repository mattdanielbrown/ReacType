import { Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import Button from '@mui/material/Button';
import React, { useState } from 'react';
import { RootState } from '../../redux/store';
import TextField from '@mui/material/TextField';
import { allCooperativeState } from '../../redux/reducers/slice/appStateSlice';
import { changeRoom } from '../../redux/reducers/slice/roomCodeSlice';
import { codePreviewCooperative } from '../../redux/reducers/slice/codePreviewSlice';
import config from '../../../../config';
import { cooperativeStyle } from '../../redux/reducers/slice/styleSlice';
// websocket front end starts here
import { io } from 'socket.io-client';
import store from '../../redux/store';
//pasted from navbarbuttons
import debounce from '../../../../node_modules/lodash/debounce.js';

// // for websockets
// // Part  - join room and room code functionality
let socket;
const { API_BASE_URL } = config;
const RoomsContainer = () => {
  const [roomCode, setRoomCode] = useState('');
  const [confirmRoom, setConfirmRoom] = useState('');
  const [userJoined, setUserJoined] = useState(false); //setting up state for joinning a room
  const [emptyInput, setEmptyInput] = useState(false);
  const dispatch = useDispatch();
  const { state, joinedRoom } = useSelector((store: RootState) => ({
    state: store.appState,
    joinedRoom: store.roomCodeSlice.roomCode
  }));
  React.useEffect(() => {
    console.log('You Joined Room---front end:', joinedRoom);
  }, [joinedRoom]);

  function initSocketConnection(roomCode) {
    if (socket) {
      //edge case check if socket connection existed
      socket.disconnect();
    }

    socket = io(API_BASE_URL, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log(`You connected with id: ${socket.id}`);
      socket.emit('join-room', roomCode); // Join the room when connected
    });

    // Receiving the room state from the backend
    socket.on('room-state-update', (stateFromServer) => {
      const newState = JSON.parse(stateFromServer);
      // Dispatch actions to update your Redux store with the received state
      store.dispatch(allCooperativeState(newState.appState));
      store.dispatch(codePreviewCooperative(newState.codePreviewCooperative));
      store.dispatch(cooperativeStyle(newState.styleSlice));
    });

    // receiving the message from the back end
    socket.on('receive message', (event) => {
      // console.log('message from server: ', event);
      let currentStore: any = JSON.stringify(store.getState());
      if (currentStore !== event) {
        currentStore = JSON.parse(currentStore);
        event = JSON.parse(event);

        if (currentStore.appState !== event.appState) {
          store.dispatch(allCooperativeState(event.appState));
        } else if (
          currentStore.codePreviewSlice !== event.codePreviewCooperative
        ) {
          store.dispatch(codePreviewCooperative(event.codePreviewCooperative));
        } else if (currentStore.styleSlice !== event.styleSlice) {
          store.dispatch(cooperativeStyle(event.styleSlice));
        }
      }
    });
  }

  function handleUserEnteredRoom(roomCode) {
    initSocketConnection(roomCode);
  }

  let previousState = store.getState();
  // console.log('Store States: ', store.getState);
  // sending info to backend whenever the redux store changes
  const handleStoreChange = debounce(() => {
    const newState = store.getState();
    const roomCode = newState.roomCodeSlice.roomCode;

    if (roomCode !== '') {
      // Emit the current room code
      socket.emit('room-code', roomCode);
    }

    if (newState !== previousState) {
      // Send the current state to the server
      socket.emit(
        'custom-event',
        'sent from front-end',
        JSON.stringify(newState),
        roomCode
      );
      previousState = newState;
    }
  }, 100);

  store.subscribe(() => {
    if (socket) {
      handleStoreChange();
    }
  });

  function joinRoom() {
    // Call handleUserEnteredRoom when joining a room
    handleUserEnteredRoom(roomCode);
    dispatch(changeRoom(roomCode));
    setConfirmRoom((confirmRoom) => roomCode);
    setUserJoined(true); //setting joined room to true for rendering leave room button
  }

  function leaveRoom() {
    if (socket) socket.disconnect(); //disconnecting socket
    dispatch(changeRoom(''));
    setRoomCode('');
    setUserJoined(false); //setting joined to false so join button appear
  }

  return (
    <div>
      <Stack //stack styling for container
        spacing={2}
        sx={{
          paddingTop: '20px',
          maxWidth: '230px',
          alignItems: 'center',
          margin: '0 auto 0 auto'
        }}
      >
        {' '}
        {/* live room display */}
        <Typography variant="h6" color={'white'}>
          Live Room: {joinedRoom}
        </Typography>
        {/*  Set up condition rendering depends on if user joined a room then render leave button if not render join button */}
        {userJoined ? (
          <Button
            variant="contained"
            onClick={() => leaveRoom()}
            sx={{
              backgroundColor: '#ffffff',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#C6C6C6',
                borderColor: '#0062cc'
              }
            }}
          >
            {' '}
            Leave Room{' '}
          </Button>
        ) : (
          <>
            <TextField
              hiddenLabel={true}
              id="filled-hidden-label-small"
              variant="filled"
              size="small"
              value={roomCode}
              placeholder="Input Room Number"
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={roomCode.trim() === ''}
              onClick={() => joinRoom()}
              sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#C6C6C6',
                  borderColor: '#0062cc'
                }
              }}
            >
              {' '}
              Join Room{' '}
            </Button>
          </>
        )}
      </Stack>
    </div>
  );
};

export default RoomsContainer;
